\echo '── 10 · Döngü hesabı: 04:00 → 04:00'

-- Varsayılan ayar: Europe/Istanbul, 04:00
SELECT t.eq(ephemeral.cycle_of('2026-10-17 03:59:59+03'), date '2026-10-16',
            '03:59:59 hâlâ önceki gece');
SELECT t.eq(ephemeral.cycle_of('2026-10-17 04:00:00+03'), date '2026-10-17',
            '04:00:00 yeni gece başlar');
SELECT t.eq(ephemeral.cycle_of('2026-10-17 00:30:00+03'), date '2026-10-16',
            'gece yarısını geçmek yeni gece demek değildir');
SELECT t.eq(ephemeral.cycle_of('2026-10-17 00:59:59Z'), date '2026-10-16',
            'UTC girdisi: 00:59:59Z = 03:59:59 TRT');
SELECT t.eq(ephemeral.cycle_of('2026-10-17 01:00:00Z'), date '2026-10-17',
            'UTC girdisi: 01:00:00Z = 04:00:00 TRT');
SELECT t.eq(ephemeral.cycle_starts_at('2026-10-16'), timestamptz '2026-10-16 04:00+03',
            'gece başlangıcı 04:00');
SELECT t.eq(ephemeral.cycle_expires_at('2026-10-16'), timestamptz '2026-10-17 04:00+03',
            'gece bitişi ertesi gün 04:00');
SELECT t.eq(ephemeral.cycle_expires_at('2026-10-16') - ephemeral.cycle_starts_at('2026-10-16'),
            interval '24 hours', 'İstanbul: gece tam 24 saat');

-- Zaman yolculuğu
SET ephemeral.now = '2026-10-17 03:59:59.999+03';
SELECT t.eq(ephemeral.current_cycle(), date '2026-10-16', 'zaman yolculuğu: 03:59:59.999');
SET ephemeral.now = '2026-10-17 04:00:00+03';
SELECT t.eq(ephemeral.current_cycle(), date '2026-10-17', 'zaman yolculuğu: 04:00:00');

UPDATE ephemeral.config SET allow_time_travel = false;
SELECT t.ok(ephemeral.clock() <> timestamptz '2026-10-17 04:00:00+03',
            'allow_time_travel = false iken ephemeral.now yok sayılır (üretim güvencesi)');
UPDATE ephemeral.config SET allow_time_travel = true;
RESET ephemeral.now;

-- Yaz saati uygulayan bir bölge: gece 23 / 25 saat sürebilir, sınır her zaman yerel 04:00
BEGIN;
UPDATE ephemeral.config SET cycle_tz = 'Europe/Berlin';
SELECT t.eq(ephemeral.cycle_expires_at('2026-10-24') - ephemeral.cycle_starts_at('2026-10-24'),
            interval '25 hours', 'Berlin, saatlerin geri alındığı gece 25 saat');
SELECT t.eq(ephemeral.cycle_expires_at('2026-03-28') - ephemeral.cycle_starts_at('2026-03-28'),
            interval '23 hours', 'Berlin, saatlerin ileri alındığı gece 23 saat');
SELECT t.eq(ephemeral.cycle_of('2026-10-25 03:30+01'), date '2026-10-24',
            'Berlin: geri alma sonrası 03:30 CET hâlâ önceki gece');
ROLLBACK;

SELECT t.throws($$UPDATE ephemeral.config SET cycle_tz = 'Mars/Olympus_Mons'$$, '22023',
                'geçersiz saat dilimi reddedilir');
