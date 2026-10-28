-- Test yardımcıları. Testler tek bir işlemde çalışır ve sonunda t.finish() bilerek hata
-- fırlatır: böylece hiçbir test verisi veritabanında kalmaz (bkz. run.sh).
-- Her doğrulama başarılıysa sayılır, değilse "FAIL: …" hatasıyla durur.

CREATE SCHEMA t;
GRANT USAGE ON SCHEMA t TO authenticated, anon;

CREATE TABLE t.passed (n serial PRIMARY KEY, label text NOT NULL);
GRANT INSERT ON t.passed TO authenticated, anon;
GRANT USAGE ON SEQUENCE t.passed_n_seq TO authenticated, anon;

-- Testlerde adıyla anılan kimlikler: t.id('ayse'), t.id('rihtim'), t.id('sohbet_rihtim')…
CREATE TABLE t.ids (name text PRIMARY KEY, id uuid NOT NULL);
GRANT SELECT, INSERT ON t.ids TO authenticated, anon;

CREATE FUNCTION t.id(p_name text) RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT id FROM t.ids WHERE name = p_name
$$;

CREATE FUNCTION t.ok(p_cond boolean, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_cond IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL: %', p_label;
  END IF;
  INSERT INTO t.passed (label) VALUES (p_label);
END $$;

CREATE FUNCTION t.eq(p_actual anycompatible, p_expected anycompatible, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'FAIL: % (beklenen: %, gelen: %)', p_label, p_expected, p_actual;
  END IF;
  INSERT INTO t.passed (label) VALUES (p_label);
END $$;

-- p_sql'in p_sqlstate hatasıyla (ve verildiyse p_message mesajıyla) başarısız olduğunu doğrular.
CREATE FUNCTION t.throws(p_sql text, p_sqlstate text, p_label text, p_message text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_raised boolean := false;
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE <> p_sqlstate OR (p_message IS NOT NULL AND SQLERRM <> p_message) THEN
      RAISE EXCEPTION 'FAIL: % (beklenen % %, gelen %: %)', p_label, p_sqlstate, coalesce(p_message, ''), SQLSTATE, SQLERRM;
    END IF;
    v_raised := true;
  END;
  IF NOT v_raised THEN
    RAISE EXCEPTION 'FAIL: % (hata bekleniyordu, gelmedi)', p_label;
  END IF;
  INSERT INTO t.passed (label) VALUES (p_label);
END $$;

-- Uygulamadaki gibi oturum açmış kullanıcı olarak devam eder (rol: authenticated).
-- Yöneticiye dönmek için: RESET ROLE;
CREATE FUNCTION t.login(p_user uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
END $$;

-- Saati değiştirir (yalnızca bu işlemde; allow_time_travel aşağıda açılır).
CREATE FUNCTION t.at(p_time timestamptz) RETURNS void
LANGUAGE sql AS $$
  SELECT set_config('here.now', p_time::text, true)
$$;

CREATE FUNCTION t.finish() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'TAMAM: % test geçti (değişiklikler geri alındı)', (SELECT count(*) FROM t.passed);
END $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA t TO authenticated, anon;

UPDATE private.config SET allow_time_travel = true;

-- Ortak kişiler. Uygulamadaki gibi önce giriş kaydı (auth.users), sonra profil.
INSERT INTO t.ids (name, id) VALUES
  ('ayse',   '00000000-0000-4000-8000-00000000000a'),
  ('burak',  '00000000-0000-4000-8000-00000000000b'),
  ('cem',    '00000000-0000-4000-8000-00000000000c'),
  ('deniz',  '00000000-0000-4000-8000-00000000000d'),
  ('rihtim', '00000000-0000-4000-8000-0000000000f1'),
  ('sahne',  '00000000-0000-4000-8000-0000000000f2'),
  ('moda',   '00000000-0000-4000-8000-0000000000f3');

INSERT INTO auth.users (id, email)
SELECT t.id(name), name || '@test.invalid' FROM unnest(ARRAY['ayse', 'burak', 'cem', 'deniz']) AS name;
INSERT INTO public.profiles (id, username, display_name) VALUES
  (t.id('ayse'),  'ayse',  'Ayşe'),
  (t.id('burak'), 'burak', 'Burak'),
  (t.id('cem'),   'cem',   'Cem'),
  (t.id('deniz'), 'deniz', 'Deniz');

-- Üç mekân (Kadıköy): Rıhtım ile Sahne arası ~400 m, Rıhtım ile Moda ~770 m.
INSERT INTO public.venues (id, name, category, area, lat, lng) VALUES
  (t.id('rihtim'), 'Rıhtım Açıkhava', 'konser', 'Rıhtım',   40.9905, 29.0225),
  (t.id('sahne'),  'Sahne Kadıköy',   'konser', 'Bahariye', 40.9918, 29.0270),
  (t.id('moda'),   'Moda Sahili',     'acik',   'Moda',     40.9842, 29.0262);

-- Mekânın tam yerinde yer bildirir (uygulamadaki "Yer bildir" düğmesi).
CREATE FUNCTION t.check_in(p_venue text) RETURNS public.check_ins
LANGUAGE sql AS $$
  SELECT c.* FROM public.venues v, LATERAL public.check_in(v.id, v.lat, v.lng) c WHERE v.id = t.id(p_venue)
$$;
GRANT EXECUTE ON FUNCTION t.check_in(text) TO authenticated;
