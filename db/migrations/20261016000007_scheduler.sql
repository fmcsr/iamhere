-- migrate:up
-- ─────────────────────────────────────────────────────────────────────────────
-- 0007 · Zamanlayıcı: run_maintenance() dakikada bir
--
-- "Her gün 04:00'te çalış" değil, "dakikada bir, süresi dolanı temizle": saat dilimi ve
-- yaz saati bilgisi gerektirmez, kaçan bir tur sonrakinde telafi edilir. Görünürlük zaten
-- RLS ile 04:00:00'da kesildiği için fiziksel silme en geç ~1 dakika sonra gerçekleşir.
--
-- pg_cron yoksa (veya bu veritabanı cron.database_name değilse) aynı çağrıyı uygulama
-- worker'ı dakikada bir yapmalıdır — tablo sahibi rolle ve transaction bloğu DIŞINDA:
--   CALL ephemeral.run_maintenance();
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_available_extensions WHERE name = 'pg_cron')
     AND current_setting('shared_preload_libraries') LIKE '%pg_cron%'
     AND current_setting('cron.database_name', true) = current_database()
  THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    PERFORM cron.schedule('ephemeral-maintenance', '* * * * *',
                          'CALL ephemeral.run_maintenance()');
  ELSE
    RAISE NOTICE 'pg_cron kullanılamıyor: CALL ephemeral.run_maintenance() dakikada bir worker tarafından çağrılmalı';
  END IF;
END $$;


-- migrate:down
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('ephemeral-maintenance');
  END IF;
END $$;
