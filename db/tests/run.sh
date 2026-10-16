#!/usr/bin/env bash
# Veritabanı testleri.
#   1) Migration'ları (yalnızca "migrate:up" bölümleri, dbmate gibi her dosya tek
#      transaction) boş bir şablon veritabanına uygular.
#   2) Her *.test.sql dosyasını şablondan kopyalanan AYRI bir veritabanında çalıştırır
#      (testler zaman yolculuğu yaptığından birbirini etkilemesin).
#   3) Migration'ların geri alınabildiğini doğrular: up → down → up.
#
# Bağlantı standart PG ortam değişkenleriyle: PGHOST, PGPORT, PGUSER, PGPASSWORD.
# Süper kullanıcı gerekir (CREATE DATABASE, SET ROLE, pg_stat_file).
#   ./db/tests/run.sh
#   PSQL="docker compose exec -T postgres psql -U anlik_owner" ./db/tests/run.sh
set -euo pipefail
shopt -s nullglob

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PSQL=${PSQL:-psql}
ADMIN_DB=${ADMIN_DB:-postgres}
TPL=anlik_test_tpl
MIGRATIONS=("$ROOT"/db/migrations/*.sql)
TESTS=("$ROOT"/db/tests/[0-9]*.test.sql)

run_psql() { $PSQL -X -q -v ON_ERROR_STOP=1 -v VERBOSITY=terse "$@"; }
pretty()   { sed -E 's/^psql:[^ ]*: //; s/^NOTICE:  ok - /  ✓ /; s/^(ERROR|WARNING):  /  ✗ /'; }

recreate_db() {   # recreate_db <ad> [şablon]
  run_psql -d "$ADMIN_DB" -c "DROP DATABASE IF EXISTS $1" \
                          -c "CREATE DATABASE $1${2:+ TEMPLATE $2}"
}

migrate() {       # migrate <db> up|down   (down: ters sırada)
  local db=$1 dir=$2 i f
  local n=${#MIGRATIONS[@]}
  for ((i = 0; i < n; i++)); do
    if [ "$dir" = up ]; then f=${MIGRATIONS[$i]}; else f=${MIGRATIONS[$((n - 1 - i))]}; fi
    { echo "SET client_min_messages = warning;"
      awk -v want="$dir" '/^-- migrate:up/   { on = (want == "up");   next }
                          /^-- migrate:down/ { on = (want == "down"); next }
                          on' "$f"
    } | run_psql -d "$db" --single-transaction -o /dev/null \
      || { echo "  ✗ migrate $dir başarısız: $(basename "$f")"; return 1; }
  done
}

echo "▸ Şablon veritabanı: ${#MIGRATIONS[@]} migration"
recreate_db "$TPL"
migrate "$TPL" up
run_psql -d "$TPL" -o /dev/null < "$ROOT/db/tests/_helpers.sql"

passed=0 failed=0 checks=0
log=$(mktemp)
for t in "${TESTS[@]}"; do
  name=$(basename "$t" .test.sql)
  db="anlik_test_$name"
  recreate_db "$db" "$TPL"
  echo
  if run_psql -d "$db" -o /dev/null < "$t" 2>&1 | pretty | tee "$log"; then
    passed=$((passed + 1))
  else
    failed=$((failed + 1))
  fi
  checks=$((checks + $(grep -c '✓' "$log" || true)))
  run_psql -d "$ADMIN_DB" -c "DROP DATABASE IF EXISTS $db"
done
rm -f "$log"

echo
echo "▸ Migration geri alma: up → down → up"
recreate_db anlik_test_roundtrip
migrate anlik_test_roundtrip up && migrate anlik_test_roundtrip down && migrate anlik_test_roundtrip up \
  && echo "  ✓ tüm migration'lar geri alınıp yeniden uygulanabiliyor" \
  || failed=$((failed + 1))
run_psql -d "$ADMIN_DB" -c "DROP DATABASE IF EXISTS anlik_test_roundtrip" -c "DROP DATABASE IF EXISTS $TPL"

echo
echo "Sonuç: $passed/${#TESTS[@]} test dosyası geçti · $checks doğrulama · $failed hata"
[ "$failed" -eq 0 ]
