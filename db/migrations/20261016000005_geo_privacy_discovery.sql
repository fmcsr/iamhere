-- migrate:up
-- ═════════════════════════════════════════════════════════════════════════════
-- 0005 · Konum gizliliği, anonim kimlik ve keşif
--
-- İlkeler:
--   * Ham GPS diske yazılmaz: konum ızgara hücresinin merkezine yuvarlanarak saklanır.
--   * Mesafe istemciye ham metre olarak gitmez: kovaya yuvarlanır (trilateration'a karşı).
--   * Karşılıklılık: konum pini olmayan kullanıcı kimseyi göremez ("görmek için görünür ol").
--   * Anonim kullanıcının gerçek kimliği (user_id) keşif sonuçlarında asla dönmez.
--   * Hata mesajlarına koordinat yazılmaz: PostgreSQL ERROR metinlerini sunucu loguna yazar.
--
-- SECURITY DEFINER fonksiyonların search_path'i sabittir. 'extensions' yoksa yok sayılır;
-- PostGIS'i o şemaya kuran barındırıcılarda (örn. Supabase) da çalışsın diye eklidir.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE FUNCTION ephemeral.assert_coords(p_lat float8, p_lng float8) RETURNS void
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  -- NaN ve ±Infinity da BETWEEN'den geçemez
  IF p_lat IS NULL OR p_lng IS NULL
     OR NOT (p_lat BETWEEN -90 AND 90) OR NOT (p_lng BETWEEN -180 AND 180) THEN
    RAISE EXCEPTION 'geçersiz koordinat' USING ERRCODE = 'invalid_parameter_value';
  END IF;
END $$;

-- Konumu ~p_cell_m × p_cell_m metrelik ızgara hücresinin MERKEZİNE yuvarlar.
-- Enlem bantlı kare ızgara: enlem adımı sabittir, boylam adımı bandın enlemine göre
-- genişler → hücreler her enlemde yaklaşık karedir.
-- Neden rastgele gürültü (jitter) değil? Aynı kişiyi tekrar tekrar sorgulayan biri
-- gürültünün ortalamasını alıp gerçek konuma yaklaşabilir. Izgarada aynı hücredeki herkes
-- aynı noktaya düşer; öğrenilebilecek en fazla bilgi "bu ~250 m'lik karede" olur.
CREATE FUNCTION ephemeral.snap_to_cell(p_lat float8, p_lng float8, p_cell_m int)
RETURNS geography
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
DECLARE
  lat_step float8 := p_cell_m / 111320.0::float8;           -- 1° enlem ≈ 111,32 km
  lat_c    float8 := least(greatest((floor(p_lat / lat_step) + 0.5) * lat_step, -89.9), 89.9);
  lng_step float8 := lat_step / greatest(cos(radians(lat_c)), 0.01);
  lng_c    float8 := (floor(p_lng / lng_step) + 0.5) * lng_step;
BEGIN
  RETURN ST_SetSRID(ST_MakePoint(lng_c, lat_c), 4326)::geography;
END $$;

CREATE FUNCTION ephemeral.cell_size_m(p core.location_precision) RETURNS int
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE p WHEN 'near' THEN 250 WHEN 'area' THEN 1000 END
$$;

-- Mesafe kovası: "< 500 m", "< 1 km", "< 2 km", "< 5 km" (10 km üstü → NULL).
-- Ham mesafe döndüren uygulamalarda saldırgan kendi konumunu üç noktaya taşıyıp ölçerek
-- hedefi metre hassasiyetinde bulabilmiştir. Kova, iki tarafın hücresinden hassas olamaz.
CREATE FUNCTION ephemeral.distance_bucket_m(p_meters float8, p_cell_m int) RETURNS int
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT min(b) FROM unnest(ARRAY[500, 1000, 2000, 5000, 10000]) AS b
  WHERE b > p_meters AND b >= p_cell_m
$$;

CREATE FUNCTION ephemeral.random_alias() RETURNS text
LANGUAGE sql VOLATILE AS $$
  SELECT (ARRAY['Uykusuz','Gezgin','Sessiz','Meraklı','Neşeli',
                'Gizemli','Yıldızlı','Rüzgârlı','Mavi','Kayıp'])[1 + floor(random() * 10)::int]
      || ' ' ||
         (ARRAY['Baykuş','Martı','Tilki','Kedi','Yunus',
                'Kirpi','Ceylan','Atmaca','Sincap','Kaplumbağa'])[1 + floor(random() * 10)::int]
      || ' ' || (10 + floor(random() * 90)::int)
$$;


-- Kullanıcının bu gecelik anonim kimliği (yoksa oluşturur). Gece bitince bölümüyle silinir.
CREATE FUNCTION ephemeral.persona_for(p_user_id uuid) RETURNS ephemeral.personas
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
DECLARE
  v_cycle date := ephemeral.current_cycle();
  v       ephemeral.personas;
BEGIN
  INSERT INTO ephemeral.personas (cycle_date, user_id, alias)
  VALUES (v_cycle, p_user_id, ephemeral.random_alias())
  ON CONFLICT (cycle_date, user_id) DO NOTHING;

  SELECT * INTO STRICT v
  FROM ephemeral.personas WHERE cycle_date = v_cycle AND user_id = p_user_id;
  RETURN v;
END $$;


-- Konum pinini yazar/günceller. Konuma YAZMANIN TEK YOLU budur (tabloya INSERT yetkisi yok).
-- Aynı hücrede kalan güncellemeler indeksli kolonu değiştirmediği için ucuz HOT update olur.
CREATE FUNCTION ephemeral.upsert_presence(
  p_user_id      uuid,
  p_lat          float8,
  p_lng          float8,
  p_status_text  text    DEFAULT NULL,
  p_anonymous    boolean DEFAULT NULL)        -- NULL → profildeki varsayılan
RETURNS ephemeral.presence
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
DECLARE
  v_cycle    date := ephemeral.current_cycle();
  v_profile  core.profiles;
  v_cell     int;
  v_persona  uuid;
  v_row      ephemeral.presence;
BEGIN
  PERFORM ephemeral.assert_coords(p_lat, p_lng);

  SELECT p.* INTO v_profile
  FROM core.profiles p JOIN core.users u ON u.id = p.user_id
  WHERE p.user_id = p_user_id AND u.status = 'active';

  -- Keşfedilemez (veya aktif olmayan) kullanıcı pin bırakmaz; varsa mevcut pini de silinir.
  IF NOT FOUND OR NOT v_profile.discoverable THEN
    DELETE FROM ephemeral.presence WHERE cycle_date = v_cycle AND user_id = p_user_id;
    RETURN NULL;
  END IF;

  v_cell := ephemeral.cell_size_m(v_profile.location_precision);
  IF coalesce(p_anonymous, v_profile.default_anonymous) THEN
    v_persona := (ephemeral.persona_for(p_user_id)).id;
  END IF;

  INSERT INTO ephemeral.presence AS p (cycle_date, user_id, persona_id, geo, cell_m, status_text)
  VALUES (v_cycle, p_user_id, v_persona,
          ephemeral.snap_to_cell(p_lat, p_lng, v_cell), v_cell, p_status_text)
  ON CONFLICT (cycle_date, user_id) DO UPDATE
    SET geo         = EXCLUDED.geo,
        cell_m      = EXCLUDED.cell_m,
        persona_id  = EXCLUDED.persona_id,
        status_text = coalesce(EXCLUDED.status_text, p.status_text),
        updated_at  = ephemeral.clock()
  RETURNING p.* INTO v_row;
  RETURN v_row;
END $$;


-- Yakındaki kişiler. Engellemeler (iki yönlü), keşfedilemezler ve bayat pinler elenir.
CREATE FUNCTION ephemeral.nearby_users(
  p_viewer    uuid,
  p_radius_m  int DEFAULT 2000,
  p_limit     int DEFAULT 50)
RETURNS TABLE (
  ref_kind           text,   -- 'profile' | 'persona'
  ref_id             uuid,   -- profile → user_id, persona → persona_id
  display_name       text,
  age                int,    -- anonimse veya show_age = false ise NULL
  avatar_key         text,   -- anonimse NULL (istemci avatar_seed'den üretir)
  avatar_seed        int,
  status_text        text,
  distance_bucket_m  int     -- 500 | 1000 | 2000 | 5000 → "< X m"
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
  WITH me AS (
    SELECT p.cycle_date, p.geo, p.cell_m
    FROM ephemeral.presence p
    WHERE p.cycle_date = ephemeral.current_cycle() AND p.user_id = p_viewer
  ),
  nearest AS (
    SELECT o.cycle_date, o.user_id, o.persona_id, o.status_text,
           pr.display_name, pr.birth_date, pr.show_age, pr.avatar_key,
           ephemeral.distance_bucket_m(ST_Distance(o.geo, me.geo),
                                       greatest(o.cell_m, me.cell_m)) AS bucket
    FROM me
    JOIN ephemeral.presence o
      ON  o.cycle_date = me.cycle_date
      AND o.user_id <> p_viewer
      AND ST_DWithin(o.geo, me.geo, least(p_radius_m, 5000))
      AND o.updated_at > ephemeral.clock() - (SELECT c.presence_ttl FROM ephemeral.config c)
    JOIN core.users u     ON u.id = o.user_id AND u.status = 'active'
    JOIN core.profiles pr ON pr.user_id = o.user_id AND pr.discoverable
    WHERE NOT core.is_blocked_between(p_viewer, o.user_id)
    ORDER BY o.geo <-> me.geo
    LIMIT least(p_limit, 100)
  )
  SELECT CASE WHEN n.persona_id IS NULL THEN 'profile' ELSE 'persona' END,
         coalesce(n.persona_id, n.user_id),
         coalesce(pe.alias, n.display_name),
         CASE WHEN n.persona_id IS NULL AND n.show_age
              THEN extract(year FROM age(ephemeral.clock(), n.birth_date))::int END,
         CASE WHEN n.persona_id IS NULL THEN n.avatar_key END,
         pe.avatar_seed,
         n.status_text,
         n.bucket
  FROM nearest n
  LEFT JOIN ephemeral.personas pe ON pe.cycle_date = n.cycle_date AND pe.id = n.persona_id
  -- Aynı kova içindeki sıra gerçek mesafeyi sızdırmasın: gece boyunca sabit, sözde-rastgele.
  ORDER BY n.bucket, md5(coalesce(n.persona_id, n.user_id)::text)
$$;


-- Oda açar. Oda pini kurucunun konumunu ele vermesin diye kurucunun hassasiyetiyle maskelenir.
CREATE FUNCTION ephemeral.create_room(
  p_owner      uuid,
  p_title      text,
  p_lat        float8,
  p_lng        float8,
  p_radius_m   int     DEFAULT 1000,
  p_anonymous  boolean DEFAULT false)
RETURNS ephemeral.conversations
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
DECLARE
  v_cycle    date := ephemeral.current_cycle();
  v_cell     int;
  v_persona  uuid;
  v_room     ephemeral.conversations;
BEGIN
  PERFORM ephemeral.assert_coords(p_lat, p_lng);

  SELECT ephemeral.cell_size_m(p.location_precision) INTO v_cell
  FROM core.profiles p JOIN core.users u ON u.id = p.user_id
  WHERE p.user_id = p_owner AND u.status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'aktif profil bulunamadı' USING ERRCODE = 'no_data_found';
  END IF;

  IF p_anonymous THEN
    v_persona := (ephemeral.persona_for(p_owner)).id;
  END IF;

  INSERT INTO ephemeral.conversations (cycle_date, kind, created_by, title, geo, radius_m)
  VALUES (v_cycle, 'room', p_owner, p_title, ephemeral.snap_to_cell(p_lat, p_lng, v_cell), p_radius_m)
  RETURNING * INTO v_room;

  INSERT INTO ephemeral.conversation_members (cycle_date, conversation_id, user_id, persona_id, role)
  VALUES (v_cycle, v_room.id, p_owner, v_persona, 'owner');

  RETURN v_room;
END $$;


-- Görüntüleyenin konumunu, odanın kendi yarıçapı içinde kapsayan odalar.
CREATE FUNCTION ephemeral.nearby_rooms(p_viewer uuid, p_limit int DEFAULT 50)
RETURNS TABLE (
  conversation_id    uuid,
  title              text,
  member_count       int,
  distance_bucket_m  int,
  expires_at         timestamptz   -- istemcideki geri sayım için (gece sonu)
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
  WITH me AS (
    SELECT p.cycle_date, p.geo, p.cell_m
    FROM ephemeral.presence p
    WHERE p.cycle_date = ephemeral.current_cycle() AND p.user_id = p_viewer
  )
  SELECT c.id,
         c.title,
         mc.n,
         ephemeral.distance_bucket_m(ST_Distance(c.geo, me.geo), me.cell_m),
         ephemeral.cycle_expires_at(c.cycle_date)
  FROM me
  JOIN ephemeral.conversations c
    ON  c.cycle_date = me.cycle_date
    AND c.kind = 'room' AND c.status = 'active'
    AND ST_DWithin(c.geo, me.geo, 5000)          -- indeks dostu üst sınır
    AND ST_DWithin(c.geo, me.geo, c.radius_m)    -- odanın kendi görünürlük yarıçapı
  CROSS JOIN LATERAL (
    SELECT count(*)::int AS n
    FROM ephemeral.conversation_members m
    WHERE m.cycle_date = c.cycle_date AND m.conversation_id = c.id AND m.left_at IS NULL
  ) mc
  WHERE NOT core.is_blocked_between(p_viewer, c.created_by)
  ORDER BY c.geo <-> me.geo
  LIMIT least(p_limit, 100)
$$;


REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA core, ephemeral FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  ephemeral.persona_for(uuid),
  ephemeral.upsert_presence(uuid, float8, float8, text, boolean),
  ephemeral.nearby_users(uuid, int, int),
  ephemeral.create_room(uuid, text, float8, float8, int, boolean),
  ephemeral.nearby_rooms(uuid, int)
TO anlik_app;


-- migrate:down
DROP FUNCTION ephemeral.nearby_rooms(uuid, int);
DROP FUNCTION ephemeral.create_room(uuid, text, float8, float8, int, boolean);
DROP FUNCTION ephemeral.nearby_users(uuid, int, int);
DROP FUNCTION ephemeral.upsert_presence(uuid, float8, float8, text, boolean);
DROP FUNCTION ephemeral.persona_for(uuid);
DROP FUNCTION ephemeral.random_alias();
DROP FUNCTION ephemeral.distance_bucket_m(float8, int);
DROP FUNCTION ephemeral.cell_size_m(core.location_precision);
DROP FUNCTION ephemeral.snap_to_cell(float8, float8, int);
DROP FUNCTION ephemeral.assert_coords(float8, float8);
