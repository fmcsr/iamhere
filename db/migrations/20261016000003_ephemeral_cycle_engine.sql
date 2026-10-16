-- migrate:up
-- ═════════════════════════════════════════════════════════════════════════════
-- 0003 · ephemeral — 04:00 → 04:00 DÖNGÜ (TTL) MOTORU
--
-- "Döngü" (cycle): yerel saatle 04:00'te başlayıp ertesi gün 04:00'te biten gece-günü.
-- Döngüde oluşan HER geçici kayıt (sohbet, üyelik, mesaj, konum pini, anonim kimlik)
-- döngü bittiği an birlikte ölür. Bitiş anı herkes için aynı olduğundan satır başına TTL
-- tutmak yerine veriyi döngüye göre BÖLÜMLÜYORUZ (partition, anahtar: cycle_date):
--
--   1) Görünürlük katmanı — geçici tabloların hepsinde RLS: cycle_date = current_cycle().
--      Saat 04:00:00 olduğu an eski gece, fiziksel silme henüz çalışmamış olsa bile
--      uygulamaya GÖRÜNMEZ ve YAZILAMAZ olur.
--   2) Fiziksel silme katmanı — run_maintenance() dakikada bir (pg_cron) çalışır;
--      süresi dolan bölümü DETACH + DROP eder. Milyonlarca satırlık DELETE, WAL yığını,
--      VACUUM/bloat yok; tablo dosyası diskten anında kalkar. İdempotenttir: bir tur
--      kaçarsa sonraki tur telafi eder. "Saat 04:00'te çalış" diye bir zamanlama yoktur,
--      dolayısıyla saat dilimi / yaz saati hatasına açık değildir.
--
-- Zamanın tek doğruluk kaynağı veritabanıdır: API sunucularının saat kayması 04:00
-- sınırında tutarsızlık yaratmasın diye döngü hesabı uygulamada tekrar edilmez.
-- ═════════════════════════════════════════════════════════════════════════════

-- Tek satırlık ayar tablosu. cycle_tz / cycle_start canlıda değiştirilmemeli (mevcut
-- döngünün sınırını kaydırır); değişiklik bakım penceresi gerektirir.
CREATE TABLE ephemeral.config (
  singleton            boolean  PRIMARY KEY DEFAULT true CHECK (singleton),
  cycle_tz             text     NOT NULL DEFAULT 'Europe/Istanbul'
                       -- geçersiz saat dilimi adı bu ifadede hata fırlatır
                       CHECK ((timestamptz '2000-01-01 00:00Z' AT TIME ZONE cycle_tz) IS NOT NULL),
  cycle_start          time     NOT NULL DEFAULT '04:00',
  precreate_cycles     int      NOT NULL DEFAULT 3 CHECK (precreate_cycles BETWEEN 1 AND 14),
  presence_ttl         interval NOT NULL DEFAULT '30 minutes',
  evidence_retention   interval NOT NULL DEFAULT '90 days',
  purge_log_retention  interval NOT NULL DEFAULT '180 days',
  -- Yalnızca test/geliştirme: true iken `SET ephemeral.now = '…'` saati değiştirir.
  allow_time_travel    boolean  NOT NULL DEFAULT false
);
INSERT INTO ephemeral.config DEFAULT VALUES;


-- ── Saat ve döngü hesabı ────────────────────────────────────────────────────

CREATE FUNCTION ephemeral.clock() RETURNS timestamptz
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT CASE WHEN c.allow_time_travel
              THEN coalesce(nullif(current_setting('ephemeral.now', true), '')::timestamptz, now())
              ELSE now()
         END
  FROM ephemeral.config c
$$;

-- Bir anın ait olduğu gece. Örn. 2026-10-17 03:59 (İstanbul) → 2026-10-16.
-- Duvar saati üzerinden hesaplanır; yaz saati geçişlerinde de sınır yerel 04:00'tır.
CREATE FUNCTION ephemeral.cycle_of(p_at timestamptz) RETURNS date
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT ((p_at AT TIME ZONE c.cycle_tz) - c.cycle_start::interval)::date
  FROM ephemeral.config c
$$;

CREATE FUNCTION ephemeral.cycle_starts_at(p_cycle date) RETURNS timestamptz
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT (p_cycle + c.cycle_start) AT TIME ZONE c.cycle_tz
  FROM ephemeral.config c
$$;

-- İstemcilere "bu sohbet 04:00'te silinecek" geri sayımı için döndürülen an.
CREATE FUNCTION ephemeral.cycle_expires_at(p_cycle date) RETURNS timestamptz
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT ephemeral.cycle_starts_at(p_cycle + 1)
$$;

CREATE FUNCTION ephemeral.current_cycle() RETURNS date
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT ephemeral.cycle_of(ephemeral.clock())
$$;


-- ── Bölüm (partition) yönetimi ──────────────────────────────────────────────

-- Döngüyle silinecek tabloların kaydı. Yeni bir geçici tablo eklemek = burada kaydetmek.
-- drop_order: küçük olan önce düşer (FK nedeniyle önce çocuklar, sonra ebeveynler).
CREATE TABLE ephemeral.cycle_tables (
  table_name  name     PRIMARY KEY,
  drop_order  smallint NOT NULL UNIQUE
);

-- Silme denetim kaydı: yalnızca meta veri (hangi gece, hangi tablo, yaklaşık boyut).
-- İçerik veya kullanıcı bilgisi içermez; silmenin yapıldığını kanıtlamaya yarar.
CREATE TABLE ephemeral.purge_log (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cycle_date      date        NOT NULL,
  table_name      name        NOT NULL,
  partition_name  name        NOT NULL,
  approx_rows     bigint,                 -- pg_class.reltuples; hiç ANALYZE edilmediyse NULL
  bytes           bigint      NOT NULL,
  dropped_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX purge_log_dropped_idx ON ephemeral.purge_log (dropped_at);

CREATE FUNCTION ephemeral.partition_name(p_table name, p_cycle date) RETURNS name
LANGUAGE sql STABLE AS $$
  SELECT format('%s_c%s', p_table, to_char(p_cycle, 'YYYYMMDD'))::name
$$;

-- [p_from, p_to] gecelerinin bölümlerini (yoksa) oluşturur; oluşturulan bölüm sayısını döner.
CREATE FUNCTION ephemeral.ensure_partitions(p_from date, p_to date) RETURNS int
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  t        record;
  v_cycle  date;
  v_name   name;
  v_count  int := 0;
BEGIN
  -- Ebeveynler önce: FK hedefi olan bölümler her zaman çocuklardan önce var olsun.
  FOR t IN SELECT table_name FROM ephemeral.cycle_tables ORDER BY drop_order DESC LOOP
    FOR i IN 0 .. (p_to - p_from) LOOP
      v_cycle := p_from + i;
      v_name  := ephemeral.partition_name(t.table_name, v_cycle);
      CONTINUE WHEN to_regclass(format('ephemeral.%I', v_name)) IS NOT NULL;
      BEGIN
        EXECUTE format(
          'CREATE TABLE ephemeral.%I PARTITION OF ephemeral.%I FOR VALUES FROM (%L) TO (%L)',
          v_name, t.table_name,
          to_char(v_cycle, 'YYYY-MM-DD'), to_char(v_cycle + 1, 'YYYY-MM-DD'));
        v_count := v_count + 1;
      EXCEPTION WHEN duplicate_table OR unique_violation THEN
        NULL;   -- eşzamanlı başka bir tur oluşturdu
      END;
    END LOOP;
  END LOOP;
  RETURN v_count;
END $$;

-- Süresi dolmuş (cycle_date < p_current) bölümler. Bölüm adı <tablo>_cYYYYMMDD biçimindedir;
-- bu kalıba uymayan (elle açılmış) bir bölüme dokunulmaz.
CREATE FUNCTION ephemeral.expired_partitions(p_current date)
RETURNS TABLE (table_name name, partition_name name, cycle_date date, drop_order smallint)
LANGUAGE sql STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT x.table_name, x.relname, x.cycle_date, x.drop_order
  FROM (
    SELECT t.table_name, t.drop_order, c.relname,
           to_date(substring(c.relname FROM '_c(\d{8})$'), 'YYYYMMDD') AS cycle_date
    FROM ephemeral.cycle_tables t
    JOIN pg_inherits i ON i.inhparent = to_regclass(format('ephemeral.%I', t.table_name))
    JOIN pg_class c    ON c.oid = i.inhrelid
    WHERE c.relname = t.table_name || '_c' || substring(c.relname FROM '_c(\d{8})$')
  ) x
  WHERE x.cycle_date < p_current
$$;

-- Tek bir bölümü düşürür. Kısa lock_timeout: uzun süren bir sorgu üst tabloyu tutuyorsa
-- trafiği kilit kuyruğunda bekletmek yerine vazgeçer, sonraki turda tekrar dener.
-- (Veri zaten RLS ile görünmez olduğundan birkaç dakikalık gecikme zararsızdır.)
CREATE FUNCTION ephemeral.drop_partition(p_parent name, p_partition name, p_cycle date)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
SET lock_timeout = '2s'
AS $$
DECLARE
  v_rel    regclass := to_regclass(format('ephemeral.%I', p_partition));
  v_rows   bigint;
  v_bytes  bigint;
BEGIN
  IF v_rel IS NULL THEN
    RETURN false;   -- başka bir tur zaten düşürmüş
  END IF;

  SELECT nullif(c.reltuples, -1)::bigint, pg_total_relation_size(c.oid)
    INTO v_rows, v_bytes
    FROM pg_class c WHERE c.oid = v_rel;

  -- FK ile referans verilen bir bölüm doğrudan DROP edilemez; önce DETACH gerekir.
  EXECUTE format('ALTER TABLE ephemeral.%I DETACH PARTITION ephemeral.%I', p_parent, p_partition);
  EXECUTE format('DROP TABLE ephemeral.%I', p_partition);

  INSERT INTO ephemeral.purge_log (cycle_date, table_name, partition_name, approx_rows, bytes)
  VALUES (p_cycle, p_parent, p_partition, v_rows, v_bytes);
  RETURN true;
EXCEPTION
  WHEN lock_not_available THEN
    RAISE WARNING 'ephemeral: % için kilit alınamadı, sonraki turda denenecek', p_partition;
    RETURN false;
  WHEN undefined_table THEN
    RETURN false;   -- eşzamanlı bir tur düşürdü
END $$;


-- ── Bakım turu ──────────────────────────────────────────────────────────────
-- pg_cron ile dakikada bir:  CALL ephemeral.run_maintenance();
-- Her adım kendi transaction'ında çalışır, böylece üst tablo kilitleri anında bırakılır.
-- (Prosedüre SET search_path eklenemez — COMMIT yasaklanır — bu yüzden adlar tam nitelikli.)
CREATE PROCEDURE ephemeral.run_maintenance()
LANGUAGE plpgsql AS $$
DECLARE
  v_now    timestamptz;
  v_cycle  date;
  v_cfg    ephemeral.config;
  r        record;
BEGIN
  v_now   := ephemeral.clock();
  v_cycle := ephemeral.cycle_of(v_now);
  SELECT * INTO STRICT v_cfg FROM ephemeral.config;

  -- 1) Bu gece + önümüzdeki N gece hazır olsun: 04:00'teki ilk INSERT asla
  --    "no partition of relation found" hatası almasın.
  PERFORM ephemeral.ensure_partitions(v_cycle, v_cycle + v_cfg.precreate_cycles);
  COMMIT;

  -- 2) Süresi dolan geceleri düşür: önce eski geceler, aynı gecede önce çocuk tablolar.
  FOR r IN
    SELECT * FROM ephemeral.expired_partitions(v_cycle) ORDER BY cycle_date, drop_order
  LOOP
    PERFORM ephemeral.drop_partition(r.table_name, r.partition_name, r.cycle_date);
    COMMIT;
  END LOOP;

  -- 3) Bayat konum pini: güncellenmeyen pin gecenin bitmesini beklemeden silinir.
  --    (updated_at bilerek indekslenmez: her konum güncellemesi HOT update kalsın.)
  DELETE FROM ephemeral.presence
  WHERE cycle_date = v_cycle AND updated_at < v_now - v_cfg.presence_ttl;
  COMMIT;

  -- 4) Saklama süresi dolan moderasyon delilleri ve eski silme kayıtları.
  DELETE FROM core.report_evidence WHERE retain_until < v_now;
  DELETE FROM ephemeral.purge_log  WHERE dropped_at   < v_now - v_cfg.purge_log_retention;
  COMMIT;
END $$;


-- Uygulama rolü: döngü fonksiyonlarını çağırabilir (RLS ve kolon varsayılanları bunlara
-- dayanır) ama bakım çalıştıramaz, ayarları değiştiremez, purge_log'u göremez.
REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA core, ephemeral FROM PUBLIC;
GRANT SELECT ON ephemeral.config TO anlik_app;
GRANT EXECUTE ON FUNCTION
  ephemeral.clock(),
  ephemeral.cycle_of(timestamptz),
  ephemeral.cycle_starts_at(date),
  ephemeral.cycle_expires_at(date),
  ephemeral.current_cycle()
TO anlik_app;


-- migrate:down
DROP PROCEDURE ephemeral.run_maintenance();
DROP FUNCTION ephemeral.drop_partition(name, name, date);
DROP FUNCTION ephemeral.expired_partitions(date);
DROP FUNCTION ephemeral.ensure_partitions(date, date);
DROP FUNCTION ephemeral.partition_name(name, date);
DROP TABLE ephemeral.purge_log, ephemeral.cycle_tables;
DROP FUNCTION ephemeral.current_cycle();
DROP FUNCTION ephemeral.cycle_expires_at(date);
DROP FUNCTION ephemeral.cycle_starts_at(date);
DROP FUNCTION ephemeral.cycle_of(timestamptz);
DROP FUNCTION ephemeral.clock();
DROP TABLE ephemeral.config;
