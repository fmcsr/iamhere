\echo '── 30 · Yetkiler ve şema değişmezleri'
\set ayse '00000000-0000-7000-8000-00000000000a'
SET ephemeral.now = '2026-10-16 20:00:00+03';
CALL ephemeral.run_maintenance();

SET ROLE anlik_app;
SELECT t.throws('SELECT * FROM ephemeral.messages_c20261016', '42501',
                'bölüme doğrudan erişim yok (RLS üst tablo atlanarak delinemez)');
SELECT t.throws(format($$INSERT INTO ephemeral.presence (user_id, geo, cell_m)
                         VALUES (%L, 'POINT(28.98 41.03)', 250)$$, :'ayse'),
                '42501', 'ham konum tabloya doğrudan yazılamaz (upsert_presence zorunlu)');
SELECT t.throws(format($$UPDATE ephemeral.presence SET geo = 'POINT(28.98 41.03)'
                         WHERE user_id = %L$$, :'ayse'),
                '42501', 'ham konum UPDATE ile de yazılamaz');
SELECT t.throws(format($$INSERT INTO ephemeral.conversations (kind, created_by, title, geo, radius_m)
                         VALUES ('room', %L, 'x', 'POINT(28.98 41.03)', 500)$$, :'ayse'),
                '42501', 'oda pini doğrudan yazılamaz (create_room zorunlu)');
SELECT t.throws('CALL ephemeral.run_maintenance()', '42501', 'uygulama bakım turu çalıştıramaz');
SELECT t.ok(NOT has_function_privilege('anlik_app', 'ephemeral.run_maintenance()', 'EXECUTE'),
            '…çünkü EXECUTE yetkisi yok (daha derindeki bir DDL hatası yüzünden değil)');
SELECT t.throws('UPDATE ephemeral.config SET allow_time_travel = true', '42501',
                'uygulama ayarları (zaman yolculuğu dahil) değiştiremez');
SELECT t.throws('SELECT * FROM ephemeral.purge_log', '42501', 'uygulama silme kaydını göremez');
SELECT t.throws('SELECT ephemeral.snap_to_cell(41, 29, 250)', '42501',
                'iç yardımcı fonksiyonlar uygulamaya kapalı');
SELECT t.throws(format($$SELECT ephemeral.upsert_presence(%L, 'NaN', 29)$$, :'ayse'), '22023',
                'NaN koordinat reddedilir');
SELECT t.throws(format($$SELECT ephemeral.upsert_presence(%L, 91, 29)$$, :'ayse'), '22023',
                'aralık dışı koordinat reddedilir');
RESET ROLE;

-- Şema değişmezleri: ileride eklenecek tablolar/fonksiyonlar da bu kurallara uymak zorunda
SELECT t.ok(NOT EXISTS (
              SELECT 1 FROM pg_partitioned_table pt JOIN pg_class c ON c.oid = pt.partrelid
              WHERE c.relnamespace = 'ephemeral'::regnamespace
                AND c.relname NOT IN (SELECT table_name FROM ephemeral.cycle_tables)),
            'ephemeral şemasındaki her bölümlenmiş tablo 04:00 temizliğine kayıtlı');
SELECT t.ok(NOT EXISTS (
              SELECT 1 FROM ephemeral.cycle_tables ct
              JOIN pg_class c ON c.relname = ct.table_name
                             AND c.relnamespace = 'ephemeral'::regnamespace
              WHERE NOT c.relrowsecurity),
            'kayıtlı her geçici tabloda RLS açık');
SELECT t.ok(NOT EXISTS (
              SELECT 1 FROM pg_class c
              WHERE c.relnamespace = 'ephemeral'::regnamespace AND c.relispartition
                AND c.relkind = 'r' AND has_table_privilege('anlik_app', c.oid, 'SELECT')),
            'uygulama rolünün hiçbir bölüme doğrudan yetkisi yok');
SELECT t.ok(NOT EXISTS (
              SELECT 1 FROM pg_proc p
              WHERE p.pronamespace IN ('core'::regnamespace, 'ephemeral'::regnamespace)
                AND p.prosecdef
                AND NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%')),
            'her SECURITY DEFINER fonksiyonun search_path''i sabit');
SELECT t.ok(NOT EXISTS (
              SELECT 1 FROM pg_proc p
              WHERE p.pronamespace IN ('core'::regnamespace, 'ephemeral'::regnamespace)
                AND has_function_privilege('public', p.oid, 'EXECUTE')),
            'core/ephemeral fonksiyonlarının hiçbiri PUBLIC''e açık değil');

-- RLS fonksiyonu sorgu başına bir kez çalışır ve yalnızca bu gecenin bölümü taranır
CREATE FUNCTION t.scanned_partitions(p_sql text) RETURNS text[]
LANGUAGE plpgsql AS $$
DECLARE v_plan jsonb;
BEGIN
  EXECUTE 'EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, FORMAT JSON) ' || p_sql INTO v_plan;
  RETURN ARRAY(
    SELECT DISTINCT n->>'Relation Name'
    FROM jsonb_path_query(v_plan, 'strict $.**') AS n
    WHERE jsonb_typeof(n) = 'object' AND n ? 'Relation Name'
      AND coalesce((n->>'Actual Loops')::numeric, 0) > 0);
END $$;
SET ROLE anlik_app;
SELECT t.eq(t.scanned_partitions('SELECT count(*) FROM ephemeral.messages'),
            ARRAY['messages_c20261016'], 'çalışma zamanında bölüm budama: yalnızca bu gece taranır');
RESET ROLE;
