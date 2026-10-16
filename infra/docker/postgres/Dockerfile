# PostgreSQL 18 + PostGIS 3.6 + pg_cron (dakikalık 04:00 temizlik turu için)
FROM postgis/postgis:18-3.6

RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-18-cron \
 && rm -rf /var/lib/apt/lists/*

# İmajın kendi 10_postgis.sh betiğinden sonra çalışır
COPY initdb/ /docker-entrypoint-initdb.d/
