-- ── 30 · Yer bildirimi: yakınlık, tek mekân, canlı sayı, görünürlük ──────────

RESET ROLE;
INSERT INTO public.follows (follower_id, followee_id) VALUES (t.id('ayse'), t.id('burak')), (t.id('burak'), t.id('ayse'));
SELECT t.at('2026-10-17 22:00+03');   -- 17 Ekim gecesi

SELECT t.login(t.id('ayse'));
SELECT t.throws($$SELECT public.check_in(t.id('rihtim'), 40.9842, 29.0262)$$, 'P0001', '300 m''den uzaktan yer bildirilemez (K-17)', 'too_far');
SELECT t.ok((SELECT (public.check_in(t.id('rihtim'), 40.9918, 29.0240)).id IS NOT NULL), '~190 m yakından yer bildirilir');
SELECT t.eq((SELECT cycle_date FROM public.check_ins WHERE user_id = t.id('ayse')), date '2026-10-17', 'yer bildirimi o geceye yazılır');
SELECT t.ok(EXISTS (SELECT 1 FROM public.conversations WHERE venue_id = t.id('rihtim')), 'gecenin ilk yer bildirimi mekân sohbetini açar');
SELECT t.check_in('rihtim');
SELECT t.eq((SELECT count(*) FROM public.check_ins WHERE user_id = t.id('ayse'))::integer, 1, 'aynı mekânda yeniden bildirmek yeni kayıt açmaz');
SELECT t.throws($$INSERT INTO public.check_ins (user_id, venue_id, cycle_date) VALUES (t.id('ayse'), t.id('moda'), '2026-10-17')$$, '42501', 'yer bildirimi tabloya doğrudan yazılamaz');
SELECT t.throws($$UPDATE public.check_ins SET left_at = NULL$$, '42501', 'yer bildirimi değiştirilemez');

-- Aynı anda tek mekân (K-06): Sahne'ye geçince Rıhtım kapanır
SELECT t.check_in('sahne');
SELECT t.eq((SELECT count(*) FROM public.check_ins WHERE user_id = t.id('ayse') AND left_at IS NULL)::integer, 1, 'aynı anda tek etkin yer bildirimi');
SELECT t.eq((SELECT venue_id FROM public.check_ins WHERE user_id = t.id('ayse') AND left_at IS NULL), t.id('sahne'), 'yeni mekân etkin, önceki kapandı');

SELECT t.login(t.id('burak'));
SELECT t.check_in('sahne');
SELECT t.login(t.id('cem'));
SELECT t.check_in('sahne');

-- Burada listesi "şu an burada" ayarına uyar (S4)
SELECT t.at('2026-10-17 23:00+03');
SELECT t.login(t.id('ayse'));
SELECT t.eq((SELECT public.here_count(v) FROM public.venues v WHERE v.id = t.id('sahne')), 3, 'canlı sayı herkesi sayar (Ayşe, Burak, Cem)');
SELECT t.eq((SELECT array_agg(username ORDER BY username) FROM public.venue_people(t.id('sahne'))), ARRAY['ayse', 'burak'],
            'Burada listesi: ben ve karşılıklı takipleştiğim (Cem görünmez)');
SELECT t.login(t.id('deniz'));
SELECT t.eq((SELECT count(*) FROM public.venue_people(t.id('sahne')))::integer, 0, 'Burada listesi: kimseyle takipleşmeyen kimseyi görmez');
SELECT t.eq((SELECT count(*) FROM public.check_ins WHERE user_id = t.id('ayse'))::integer, 0, 'bu geceki yer bildirimi göremeyene gizli');
RESET ROLE;
UPDATE public.profiles SET presence_visibility = 'everyone' WHERE id = t.id('cem');
SELECT t.login(t.id('deniz'));
SELECT t.eq((SELECT array_agg(username) FROM public.venue_people(t.id('sahne'))), ARRAY['cem'], 'Burada listesi: "Herkes" seçen herkese görünür');

-- Canlı sayı son 3 saat + "Hâlâ buradayım" (K-06); sohbete yazma hakkı bundan etkilenmez (50'de)
SELECT t.at('2026-10-18 01:30+03');   -- 3,5 saat sonra, hâlâ aynı gece
SELECT t.login(t.id('burak'));
SELECT t.ok((SELECT (public.still_here()).still_here_at IS NOT NULL), '"Evet, buradayım" kaydedilir');
SELECT t.eq((SELECT public.here_count(v) FROM public.venues v WHERE v.id = t.id('sahne')), 1,
            'canlı sayı: 3 saati geçenler düşer, "Hâlâ buradayım" diyen kalır');
SELECT t.login(t.id('cem'));
SELECT t.ok((SELECT (public.leave_venue()).left_at IS NOT NULL), '"Ayrıldım" etkin yer bildirimini kapatır');
SELECT t.eq((SELECT count(*) FROM public.check_ins WHERE user_id = t.id('cem') AND left_at IS NULL)::integer, 0, 'ayrıldıktan sonra etkin yer bildirimi yok');

-- Ertesi gün dün gece "geçmiş" olur: hesabın gizliliğine uyar (S4)
SELECT t.at('2026-10-18 12:00+03');
SELECT t.login(t.id('deniz'));
SELECT t.eq((SELECT count(*) FROM public.check_ins WHERE user_id = t.id('ayse'))::integer, 2, 'açık hesabın geçmiş geceleri herkese görünür');
RESET ROLE;
UPDATE public.profiles SET is_private = true WHERE id = t.id('ayse');
SELECT t.login(t.id('deniz'));
SELECT t.eq((SELECT count(*) FROM public.check_ins WHERE user_id = t.id('ayse'))::integer, 0, 'gizli hesabın geçmiş geceleri takip etmeyene kapalı');
SELECT t.eq((SELECT public.night_count(p) FROM public.profiles p WHERE p.id = t.id('ayse')), 1, 'gece (anı) sayısı görünür, gece başına bir');
SELECT t.login(t.id('burak'));
SELECT t.eq((SELECT count(*) FROM public.check_ins WHERE user_id = t.id('ayse'))::integer, 2, 'onaylı takipçi gizli hesabın gecelerini görür');

-- Yakındaki mekânlar
SELECT t.eq((SELECT array_agg(name ORDER BY distance_m) FROM public.nearby_venues(40.9905, 29.0225, 600)
             WHERE id IN (t.id('rihtim'), t.id('sahne'), t.id('moda'))),
            ARRAY['Rıhtım Açıkhava', 'Sahne Kadıköy'], 'yakındaki mekânlar yakından uzağa (600 m içinde)');

RESET ROLE;
UPDATE public.profiles SET presence_visibility = 'mutual', is_private = false;
DELETE FROM public.follows;
