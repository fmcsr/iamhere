#!/bin/sh
# Veritabanı testlerini bağlı Supabase projesinde çalıştırır. Her şey tek bir işlemde olur ve
# sonunda bilerek geri alınır: projede hiçbir test verisi kalmaz.
#
#   supabase/tests/run.sh               şema projede yüklüyken yalnızca testler
#   supabase/tests/run.sh --migrations  önce migration'lar, sonra testler (yüklemeden önce
#                                       denemek için; bu da geri alınır)
#
# Gereken: `supabase login` ve `supabase link` yapılmış olmalı.
set -eu

root=$(cd "$(dirname "$0")/../.." && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# Dosya tek sorgu olarak gider: içindeki bütün ifadeler tek bir işlemde çalışır ve herhangi bir
# hata (t.finish() dahil) hepsini geri alır.
{
  if [ "${1:-}" = "--migrations" ]; then
    cat "$root"/supabase/migrations/*.sql
  fi
  cat "$root"/supabase/tests/[0-9]*.sql
  echo 'SELECT t.finish();'
} > "$work/run.sql"

output=$(cd "$root" && supabase db query --linked -f "$work/run.sql" 2>&1 || true)
echo "$output" | grep -E 'TAMAM|FAIL|ERROR|error' | head -20
echo "$output" | grep -q 'TAMAM:'
