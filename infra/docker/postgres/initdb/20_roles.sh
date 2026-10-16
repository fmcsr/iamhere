#!/usr/bin/env bash
# Yerel geliştirme: API'nin bağlanacağı LOGIN rolü. anlik_app grubunun üyesidir; tabloların
# sahibi olmadığı için RLS'ye tabidir. (Tablo sahibi = POSTGRES_USER = migration rolü.)
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
     -v api_password="${ANLIK_API_PASSWORD:-anlik_api_dev}" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anlik_app') THEN
    CREATE ROLE anlik_app NOLOGIN;
  END IF;
END $$;
CREATE ROLE anlik_api LOGIN PASSWORD :'api_password' IN ROLE anlik_app;
SQL
