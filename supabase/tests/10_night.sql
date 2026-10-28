-- ── 10 · Gece hesabı: 04:00 → 04:00 (K-10) ──────────────────────────────────

SELECT t.eq(public.cycle_of('2026-10-17 03:59:59+03'), date '2026-10-16', '03:59:59 hâlâ önceki gece');
SELECT t.eq(public.cycle_of('2026-10-17 04:00:00+03'), date '2026-10-17', '04:00:00 yeni gece başlar');
SELECT t.eq(public.cycle_of('2026-10-17 00:30:00+03'), date '2026-10-16', 'gece yarısını geçmek yeni gece demek değil');
SELECT t.eq(public.cycle_of('2026-10-17 01:00:00Z'), date '2026-10-17', 'UTC 01:00 = İstanbul 04:00');
SELECT t.eq(public.cycle_ends_at('2026-10-16'), timestamptz '2026-10-17 04:00+03', 'gece ertesi gün 04:00''te biter');

-- Uygulamanın geri sayımı ve 03:30 uyarısı
SELECT t.at('2026-10-17 03:30+03');
SELECT t.login(t.id('ayse'));
SELECT t.eq((SELECT cycle FROM public.night()), date '2026-10-16', 'night(): hangi gece');
SELECT t.eq((SELECT ends_at - server_now FROM public.night()), interval '30 minutes', 'night(): 03:30''da 30 dk kaldı');
RESET ROLE;

-- Zaman yolculuğu yalnızca testte açık; kapalıyken here.now yok sayılır.
UPDATE private.config SET allow_time_travel = false;
SELECT t.ok(private.clock() <> timestamptz '2026-10-17 03:30+03', 'zaman yolculuğu kapalıyken saat oynatılamaz');
UPDATE private.config SET allow_time_travel = true;

SELECT t.throws($$UPDATE private.config SET cycle_tz = 'Mars/Olympus_Mons'$$, '22023', 'geçersiz saat dilimi reddedilir');
