-- ── 55 · Ekibe bildir: genel bildirim, kanıt, takip durumu ──────────────────

RESET ROLE;
SELECT t.login(t.id('ayse'));
-- Engellediği biri başka bir hesaptan yazmaya devam ediyor: hedefsiz bildirim, ilgili kişinin adıyla.
INSERT INTO public.reports (target_kind, reason, note, reported_username)
VALUES ('other', 'taciz', 'Engelledim ama başka bir hesaptan yazmaya devam ediyor.', ' @Burak ');
SELECT t.throws($$INSERT INTO public.reports (target_kind, reason) VALUES ('message', 'spam')$$, '23514', 'mesaj bildiriminde hedef zorunlu');
SELECT t.throws($$INSERT INTO public.reports (target_kind, target_id, reason) VALUES ('other', t.id('burak'), 'taciz')$$, '23514', 'genel bildirimin hedefi olmaz');
SELECT t.throws($$INSERT INTO public.reports (target_kind, reason, status) VALUES ('other', 'taciz', 'closed')$$, '42501', 'bildirimin durumunu uygulama seçemez');
SELECT t.throws($$SELECT * FROM public.reports$$, '42501', 'bildirimleri yalnızca ekip okur');
RESET ROLE;
SELECT t.eq((SELECT evidence->>'username' FROM public.reports WHERE target_kind = 'other' AND reporter_id = t.id('ayse')), 'burak',
            'adı verilen hesabın o anki profili kanıt olarak saklanır');
SELECT t.eq((SELECT status FROM public.reports WHERE target_kind = 'other' AND reporter_id = t.id('ayse')), 'new', 'bildirim "yeni" durumunda başlar');
