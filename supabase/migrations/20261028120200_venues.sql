-- ═════════════════════════════════════════════════════════════════════════════
-- 03 · Mekânlar ve yer bildirimi
--
--   • Yer bildirimi yalnızca mekânın 300 m yakınında yapılır (K-17); sunucuda doğrulanır,
--     ham konum saklanmaz.
--   • Aynı anda tek mekân (K-06): yeni yer bildirimi öncekini kapatır. Başka yerde bildirene,
--     "Ayrıldım" diyene ya da gece bitene kadar orada sayılırsın.
--   • Canlı sayı ("342 kişi burada") yalnızca son 3 saatte yer bildirenleri ve "Hâlâ
--     buradayım" diyenleri sayar (K-06, 28.10.2026).
--   • Yer bildirimleri kalıcıdır (K-16): profildeki anı takvimi buradan gelir.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE public.venues (
  id         uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  -- K-05: Google Places kimliği; kendi eklediğimiz geçici etkinliklerde (konser, festival) boş.
  place_id   text             UNIQUE,
  name       text             NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  category   text             NOT NULL CHECK (category IN ('konser', 'bar', 'yemek', 'kafe', 'acik')),
  area       text             NOT NULL DEFAULT '',   -- semt: kartlarda tek satır bilgi
  event      text,                                   -- "Gece Treni konseri · 21:00"
  lat        double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng        double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
  location   extensions.geography(Point, 4326) GENERATED ALWAYS AS (
               extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography) STORED,
  radius_m   integer          NOT NULL DEFAULT 300 CHECK (radius_m BETWEEN 50 AND 2000),
  cover_url  text,
  created_at timestamptz      NOT NULL DEFAULT now()
);
CREATE INDEX venues_location_idx ON public.venues USING gist (location);

-- K-12: işletmenin kendi mekân sayfasını yönettiği hesap. Şemada baştan var; betada kullanılmaz,
-- bu yüzden hiçbir politikası ve uygulamaya açık yetkisi yok.
CREATE TABLE public.venue_accounts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    uuid        NOT NULL UNIQUE REFERENCES public.venues (id) ON DELETE CASCADE,
  owner_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  verified_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX venue_accounts_owner_idx ON public.venue_accounts (owner_id);

-- "To-HERE": sonra gitmek için kaydedilen mekânlar.
CREATE TABLE public.saved_venues (
  user_id    uuid        NOT NULL DEFAULT auth.uid() REFERENCES public.profiles (id) ON DELETE CASCADE,
  venue_id   uuid        NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, venue_id)
);
CREATE INDEX saved_venues_venue_idx ON public.saved_venues (venue_id);

CREATE TABLE public.check_ins (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  venue_id      uuid        NOT NULL REFERENCES public.venues (id),
  cycle_date    date        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  still_here_at timestamptz,          -- "Hâlâ buradayım" (yer bildirdikten 3 saat sonra sorulur)
  left_at       timestamptz           -- "Ayrıldım" ya da başka mekânda yer bildirimi
);
-- Bir gecede aynı anda tek etkin yer bildirimi (K-06).
CREATE UNIQUE INDEX check_ins_one_active ON public.check_ins (user_id, cycle_date) WHERE left_at IS NULL;
CREATE INDEX check_ins_user_idx ON public.check_ins (user_id, cycle_date DESC);
CREATE INDEX check_ins_venue_idx ON public.check_ins (venue_id, cycle_date);


-- ── Canlılık ─────────────────────────────────────────────────────────────────

-- Canlı sayıya giren yer bildirimi: bu gece, etkin, son 3 saatte ya da "Hâlâ buradayım" demiş.
CREATE FUNCTION private.is_live(c public.check_ins) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT c.cycle_date = public.current_cycle()
     AND c.left_at IS NULL
     AND (c.still_here_at IS NOT NULL
          OR c.created_at > private.clock() - (SELECT cfg.live_window FROM private.config cfg))
$$;

-- Hesaplanmış alan: venues?select=id,name,here_count
CREATE FUNCTION public.here_count(v public.venues) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(*)::integer FROM public.check_ins c
  WHERE c.venue_id = v.id AND c.cycle_date = public.current_cycle() AND private.is_live(c)
$$;

-- Mekândaki "Burada" listesi: yalnızca bu geceki konumunu görebildiğim kişiler (S4).
CREATE FUNCTION public.venue_people(p_venue_id uuid) RETURNS SETOF public.profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.* FROM public.check_ins c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE c.venue_id = p_venue_id AND c.cycle_date = public.current_cycle()
    AND private.is_live(c) AND private.can_see_presence(c.user_id)
  ORDER BY c.created_at DESC
$$;

-- Yakındaki mekânlar, yakından uzağa.
CREATE FUNCTION public.nearby_venues(p_lat double precision, p_lng double precision, p_radius_m integer DEFAULT 3000)
RETURNS TABLE (
  id uuid, name text, category text, area text, event text, lat double precision, lng double precision,
  radius_m integer, cover_url text, distance_m integer, here_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT v.id, v.name, v.category, v.area, v.event, v.lat, v.lng, v.radius_m, v.cover_url,
         round(extensions.st_distance(v.location, here.point))::integer,
         public.here_count(v)
  FROM public.venues v,
       LATERAL (SELECT extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography AS point) here
  WHERE extensions.st_dwithin(v.location, here.point, least(greatest(p_radius_m, 100), 20000))
  ORDER BY v.location OPERATOR(extensions.<->) here.point
  LIMIT 100
$$;


-- ── Yer bildirimi (API) ──────────────────────────────────────────────────────

-- Yer bildir. Uzaktaysa 'too_far' hatası döner (uygulama "Yol tarifi" gösterir, S5). Başka bir
-- mekânda etkin yer bildirimi varsa kapatılır (onayı uygulama sorar, K-06). Aynı mekânda zaten
-- etkinse mevcut kaydı döndürür.
CREATE FUNCTION public.check_in(p_venue_id uuid, p_lat double precision, p_lng double precision)
RETURNS public.check_ins
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_now    timestamptz := private.clock();
  v_cycle  date := public.cycle_of(v_now);
  v_venue  public.venues;
  v_active public.check_ins;
  v_row    public.check_ins;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_venue FROM public.venues WHERE id = p_venue_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'venue_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF NOT extensions.st_dwithin(
       v_venue.location,
       extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
       v_venue.radius_m) THEN
    RAISE EXCEPTION 'too_far' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_active FROM public.check_ins
  WHERE user_id = v_uid AND cycle_date = v_cycle AND left_at IS NULL
  FOR UPDATE;
  IF FOUND THEN
    IF v_active.venue_id = p_venue_id THEN
      RETURN v_active;
    END IF;
    UPDATE public.check_ins SET left_at = v_now WHERE id = v_active.id;
  END IF;

  INSERT INTO public.check_ins (user_id, venue_id, cycle_date, created_at)
  VALUES (v_uid, p_venue_id, v_cycle, v_now)
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- "Evet, buradayım" (K-06): canlı sayıda kalmaya devam eder.
CREATE FUNCTION public.still_here() RETURNS public.check_ins
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.check_ins SET still_here_at = private.clock()
  WHERE user_id = auth.uid() AND cycle_date = public.current_cycle() AND left_at IS NULL
  RETURNING *
$$;

-- "Ayrıldım": sohbet 04:00'e kadar okunur, yazılamaz (K-06).
CREATE FUNCTION public.leave_venue() RETURNS public.check_ins
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.check_ins SET left_at = private.clock()
  WHERE user_id = auth.uid() AND cycle_date = public.current_cycle() AND left_at IS NULL
  RETURNING *
$$;


-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.venues         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_venues   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins      ENABLE ROW LEVEL SECURITY;

-- Mekânlar herkese açık yerler; uygulama yalnızca okur (ekleme ve düzenleme panelden).
CREATE POLICY venues_select ON public.venues FOR SELECT TO authenticated USING (true);

CREATE POLICY saved_venues_own ON public.saved_venues FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- Bu geceki yer bildirimi "şu an burada" ayarına, geçmiş geceler hesabın gizliliğine uyar (S4).
-- Yer bildirimi yalnızca check_in() ile yapılır; tabloya doğrudan yazılamaz.
CREATE POLICY check_ins_select ON public.check_ins FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())
         OR CASE WHEN cycle_date = (SELECT public.current_cycle())
                 THEN private.can_see_presence(user_id)
                 ELSE private.can_see_profile(user_id)
            END);


-- ── Yetkiler ─────────────────────────────────────────────────────────────────

REVOKE ALL ON public.venues, public.venue_accounts, public.saved_venues, public.check_ins FROM anon, authenticated;
GRANT SELECT ON public.venues, public.check_ins TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_venues TO authenticated;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.here_count(public.venues), public.venue_people(uuid),
  public.nearby_venues(double precision, double precision, integer),
  public.check_in(uuid, double precision, double precision), public.still_here(), public.leave_venue()
TO authenticated;
