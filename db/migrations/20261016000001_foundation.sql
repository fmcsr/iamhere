-- migrate:up
-- ─────────────────────────────────────────────────────────────────────────────
-- 0001 · Temel: eklentiler, şemalar, roller
--
--   core       → KALICI veri: hesap, profil, engelleme, şikâyet
--   ephemeral  → GECE-GÜNÜ veri (04:00 → 04:00): sohbet, mesaj, konum pini, anonim kimlik.
--                Döngü bitince fiziksel olarak silinir (bkz. 0003).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE SCHEMA core;
CREATE SCHEMA ephemeral;

-- API'nin bağlandığı rollerin grubu. Gerçek LOGIN rolü altyapı tarafından açılıp bu gruba
-- eklenir:  CREATE ROLE anlik_api LOGIN PASSWORD '…' IN ROLE anlik_app;
-- Bu rol tabloların sahibi DEĞİLDİR → RLS politikaları ona uygulanır.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anlik_app') THEN
    CREATE ROLE anlik_app NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA core, ephemeral TO anlik_app;

-- KURAL: Fonksiyonlar PostgreSQL'de varsayılan olarak herkese (PUBLIC) açıktır ve
-- "ALTER DEFAULT PRIVILEGES IN SCHEMA … REVOKE … FROM PUBLIC" bunu KAPATMAZ (şema bazlı
-- varsayılanlar yalnızca yetki ekleyebilir). Bu yüzden fonksiyon oluşturan her migration
-- GRANT'lerden önce şunu çalıştırır:
--   REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA core, ephemeral FROM PUBLIC;
-- Unutulursa db/tests/30_privileges testi kırılır.


-- migrate:down
DROP SCHEMA ephemeral CASCADE;
DROP SCHEMA core CASCADE;
-- anlik_app rolü (küme geneli) ve postgis (paylaşılan) bilinçli olarak bırakılır.
