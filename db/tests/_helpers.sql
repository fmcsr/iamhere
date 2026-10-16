-- Test yardımcıları: yalnızca test şablon veritabanına yüklenir, migration'ların parçası değildir.
-- Her doğrulama başarılıysa "ok - …" NOTICE'ı basar, değilse istisna fırlatır (ON_ERROR_STOP).

CREATE SCHEMA t;
GRANT USAGE ON SCHEMA t TO PUBLIC;

CREATE FUNCTION t.ok(p_cond boolean, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_cond IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL: %', p_label;
  END IF;
  RAISE NOTICE 'ok - %', p_label;
END $$;

CREATE FUNCTION t.eq(p_actual anycompatible, p_expected anycompatible, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'FAIL: % (beklenen: %, gelen: %)', p_label, p_expected, p_actual;
  END IF;
  RAISE NOTICE 'ok - %', p_label;
END $$;

-- p_sql'in tam olarak p_sqlstate hatasıyla başarısız olduğunu doğrular.
CREATE FUNCTION t.throws(p_sql text, p_sqlstate text, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_raised boolean := false;
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE <> p_sqlstate THEN
      RAISE EXCEPTION 'FAIL: % (beklenen SQLSTATE %, gelen %: %)', p_label, p_sqlstate, SQLSTATE, SQLERRM;
    END IF;
    v_raised := true;
  END;
  IF NOT v_raised THEN
    RAISE EXCEPTION 'FAIL: % (hata bekleniyordu, gelmedi)', p_label;
  END IF;
  RAISE NOTICE 'ok - % [%]', p_label, p_sqlstate;
END $$;

-- Zaman yolculuğu yalnızca test veritabanında açılır.
UPDATE ephemeral.config SET allow_time_travel = true;

-- Ortak kişiler (kalıcı veri)
INSERT INTO core.users (id) VALUES
  ('00000000-0000-7000-8000-00000000000a'),   -- Ayşe
  ('00000000-0000-7000-8000-00000000000b'),   -- Burak
  ('00000000-0000-7000-8000-00000000000c'),   -- Cem
  ('00000000-0000-7000-8000-00000000000d');   -- Deniz
INSERT INTO core.profiles (user_id, display_name, birth_date) VALUES
  ('00000000-0000-7000-8000-00000000000a', 'Ayşe',  '1996-05-14'),
  ('00000000-0000-7000-8000-00000000000b', 'Burak', '1994-11-02'),
  ('00000000-0000-7000-8000-00000000000c', 'Cem',   '1999-01-30'),
  ('00000000-0000-7000-8000-00000000000d', 'Deniz', '2000-07-21');
