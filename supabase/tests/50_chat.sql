-- ── 50 · Sohbetler: mekân sohbeti, planlar, birebir mesaj, 04:00 ────────────

RESET ROLE;
SELECT t.at('2026-10-22 22:00+03');
SELECT t.login(t.id('ayse'));
SELECT t.check_in('rihtim');
SELECT t.login(t.id('burak'));
SELECT t.check_in('rihtim');
SELECT t.login(t.id('cem'));
SELECT t.check_in('sahne');
RESET ROLE;
INSERT INTO t.ids SELECT 'sohbet_rihtim', id FROM public.conversations WHERE venue_id = t.id('rihtim') AND cycle_date = '2026-10-22';
SELECT t.eq((SELECT count(*) FROM public.conversations WHERE venue_id = t.id('rihtim') AND cycle_date = '2026-10-22')::integer, 1,
            'mekân başına gecede tek sohbet (K-07)');

-- Mekân sohbeti: yer bildiren okur ve yazar
SELECT t.login(t.id('ayse'));
INSERT INTO public.messages (conversation_id, body) VALUES (t.id('sohbet_rihtim'), 'Selam Rıhtım!');
INSERT INTO t.ids SELECT 'mesaj', id FROM public.messages WHERE body = 'Selam Rıhtım!';
SELECT t.login(t.id('burak'));
SELECT t.eq((SELECT count(*) FROM public.messages WHERE conversation_id = t.id('sohbet_rihtim'))::integer, 1, 'mekânda yer bildiren sohbeti okur');
SELECT t.eq((SELECT p.username FROM public.messages m JOIN public.profiles p ON p.id = m.sender_id
             WHERE m.id = t.id('mesaj')), 'ayse', 'sohbette yazan @kullanıcı adıyla görünür (K-04)');
SELECT t.throws($$INSERT INTO public.messages (conversation_id, body) VALUES (t.id('sohbet_rihtim'), '   ')$$, '23514', 'boş mesaj gönderilemez');
SELECT t.login(t.id('cem'));
SELECT t.eq((SELECT count(*) FROM public.messages WHERE conversation_id = t.id('sohbet_rihtim'))::integer, 0, 'yer bildirmeyen mekân sohbetini okuyamaz');
SELECT t.throws($$INSERT INTO public.messages (conversation_id, body) VALUES (t.id('sohbet_rihtim'), 'Ben de geliyorum')$$, '42501', 'yer bildirmeyen yazamaz');

-- Mekân değiştirince eski sohbet 04:00'e kadar salt okunur; geri dönünce yazma geri gelir (K-06)
SELECT t.login(t.id('ayse'));
SELECT t.check_in('sahne');
SELECT t.eq((SELECT count(*) FROM public.messages WHERE conversation_id = t.id('sohbet_rihtim'))::integer, 1, 'ayrıldığın mekânın sohbetini okursun');
SELECT t.throws($$INSERT INTO public.messages (conversation_id, body) VALUES (t.id('sohbet_rihtim'), 'Hâlâ buradayım')$$, '42501', 'ayrıldığın mekânın sohbetine yazamazsın');
SELECT t.check_in('rihtim');
INSERT INTO public.messages (conversation_id, body) VALUES (t.id('sohbet_rihtim'), 'Geri döndüm');
SELECT t.eq((SELECT count(*) FROM public.messages WHERE conversation_id = t.id('sohbet_rihtim') AND sender_id = t.id('ayse'))::integer, 2,
            'geri dönüp yer bildirince yazma geri gelir');

-- Canlı sayıdan düşmek (3 saat) yazma hakkını etkilemez
SELECT t.at('2026-10-23 02:30+03');
SELECT t.login(t.id('burak'));
INSERT INTO public.messages (conversation_id, body) VALUES (t.id('sohbet_rihtim'), 'Gece uzun');
SELECT t.eq((SELECT count(*) FROM public.messages WHERE conversation_id = t.id('sohbet_rihtim'))::integer, 3, '3 saat sonra da sohbete yazılır');

-- Plan: "Ben de varım", saati 04:00'ü geçemez
INSERT INTO public.plans (conversation_id, emoji, title, place, starts_at)
VALUES (t.id('sohbet_rihtim'), '🍜', 'Çorbacıya', 'Çıkış kapısı', '2026-10-23 03:15+03');
INSERT INTO t.ids SELECT 'plan', id FROM public.plans WHERE title = 'Çorbacıya';
SELECT t.eq((SELECT count(*) FROM public.plan_participants WHERE plan_id = t.id('plan'))::integer, 1, 'planı kuran katılır');
SELECT t.ok(EXISTS (SELECT 1 FROM public.messages WHERE plan_id = t.id('plan')), 'plan sohbette kart olarak görünür');
SELECT t.throws($$INSERT INTO public.plans (conversation_id, title, starts_at) VALUES (t.id('sohbet_rihtim'), 'Kahvaltı', '2026-10-23 09:00+03')$$,
                '22023', 'plan 04:00''ü geçemez', 'plan_after_night');
SELECT t.throws($$INSERT INTO public.messages (conversation_id, body, plan_id) VALUES (t.id('sohbet_rihtim'), 'Sahte plan', t.id('plan'))$$,
                '42501', 'sahte plan kartı eklenemez');
SELECT t.login(t.id('ayse'));
INSERT INTO public.plan_participants (plan_id) VALUES (t.id('plan'));
SELECT t.eq((SELECT count(*) FROM public.plan_participants WHERE plan_id = t.id('plan'))::integer, 2, '"Ben de varım"');
DELETE FROM public.plan_participants WHERE plan_id = t.id('plan') AND user_id = t.id('ayse');
SELECT t.eq((SELECT count(*) FROM public.plan_participants WHERE plan_id = t.id('plan'))::integer, 1, '"Ben de varım" geri alınır');

-- Birebir mesaj: istek modeli (K-08)
SELECT t.login(t.id('deniz'));
INSERT INTO t.ids SELECT 'dm_deniz_ayse', (public.start_direct(t.id('ayse'), 'Merhaba, konserde tanıştık')).id;
SELECT t.ok((SELECT accepted_at IS NULL FROM public.conversations WHERE id = t.id('dm_deniz_ayse')), 'ilk mesaj istek olarak gider');
SELECT t.throws($$INSERT INTO public.messages (conversation_id, body) VALUES (t.id('dm_deniz_ayse'), 'Orada mısın?')$$, '42501', 'kabul edilmeden ikinci mesaj gönderilemez');
SELECT t.throws($$SELECT public.start_direct(t.id('burak'), 'bak: https://ornek.com')$$, '22023', 'istekteki ilk mesajda bağlantı olmaz', 'link_in_request');
SELECT t.eq((SELECT (public.start_direct(t.id('ayse'), 'Tekrar selam')).id), t.id('dm_deniz_ayse'), 'aynı kişiye ikinci istek açılmaz, mevcut sohbet döner');
SELECT t.login(t.id('ayse'));
SELECT t.eq((SELECT count(*) FROM public.messages WHERE conversation_id = t.id('dm_deniz_ayse'))::integer, 1, 'alıcı isteği görür');
SELECT t.ok((SELECT (public.accept_request(t.id('dm_deniz_ayse'))).accepted_at IS NOT NULL), 'alıcı isteği kabul eder');
INSERT INTO public.messages (conversation_id, body) VALUES (t.id('dm_deniz_ayse'), 'Selam!');
SELECT t.login(t.id('deniz'));
INSERT INTO public.messages (conversation_id, body) VALUES (t.id('dm_deniz_ayse'), 'Harika');
SELECT t.eq((SELECT count(*) FROM public.messages WHERE conversation_id = t.id('dm_deniz_ayse'))::integer, 3, 'kabul edilince iki taraf da yazar');

RESET ROLE;
INSERT INTO public.follows (follower_id, followee_id) VALUES (t.id('burak'), t.id('cem')), (t.id('cem'), t.id('burak'));
SELECT t.login(t.id('burak'));
INSERT INTO t.ids SELECT 'dm_burak_cem', (public.start_direct(t.id('cem'), 'Neredesin?')).id;
SELECT t.ok((SELECT accepted_at IS NOT NULL FROM public.conversations WHERE id = t.id('dm_burak_cem')), 'karşılıklı takipleşenin mesajı doğrudan gelen kutusuna düşer');

SELECT t.login(t.id('deniz'));
INSERT INTO t.ids SELECT 'dm_deniz_cem', (public.start_direct(t.id('cem'), 'Selam')).id;
SELECT t.login(t.id('cem'));
SELECT public.decline_request(t.id('dm_deniz_cem'));
SELECT t.eq((SELECT count(*) FROM public.conversations WHERE id = t.id('dm_deniz_cem'))::integer, 0, 'silinen istek alıcıdan kalkar');
SELECT t.login(t.id('deniz'));
SELECT t.eq((SELECT count(*) FROM public.conversations WHERE id = t.id('dm_deniz_cem'))::integer, 1, 'gönderen isteğinin silindiğini bilmez');

RESET ROLE;
UPDATE private.config SET daily_requests = 2;
SELECT t.login(t.id('deniz'));
SELECT t.throws($$SELECT public.start_direct(t.id('burak'), 'Selam')$$, '54000', 'gecelik istek sınırı', 'request_limit');
RESET ROLE;
UPDATE private.config SET daily_requests = 20;

-- Şikâyet: mesaj 04:00'te silinse de içeriği kanıt olarak kalır
SELECT t.login(t.id('burak'));
INSERT INTO public.reports (target_kind, target_id, reason) VALUES ('message', t.id('mesaj'), 'taciz');
SELECT t.throws($$SELECT * FROM public.reports$$, '42501', 'şikâyetleri yalnızca panel okur');

-- Engelleme: engellenen yazamaz, mesajları görünmez
SELECT t.login(t.id('ayse'));
INSERT INTO public.blocks (blocker_id, blocked_id) VALUES (t.id('ayse'), t.id('deniz'));
SELECT t.eq((SELECT count(*) FROM public.messages WHERE conversation_id = t.id('dm_deniz_ayse') AND sender_id = t.id('deniz'))::integer, 0,
            'engellenenin mesajları görünmez');
SELECT t.login(t.id('deniz'));
SELECT t.throws($$INSERT INTO public.messages (conversation_id, body) VALUES (t.id('dm_deniz_ayse'), 'Hey')$$, '42501', 'engellenen yazamaz');
SELECT t.throws($$SELECT public.start_direct(t.id('ayse'), 'Hey')$$, 'P0002', 'engellenen yeni sohbet açamaz', 'recipient_unavailable');

-- 04:00: eski gece anında görünmez olur, sonra silinir; yer bildirimleri kalır (K-10, K-16)
SELECT t.at('2026-10-23 03:59:59+03');
SELECT t.login(t.id('burak'));
SELECT t.ok((SELECT count(*) FROM public.messages WHERE conversation_id = t.id('sohbet_rihtim')) > 0, '03:59:59''da sohbet duruyor');
SELECT t.at('2026-10-23 04:00:00+03');
SELECT t.eq((SELECT count(*) FROM public.messages WHERE conversation_id = t.id('sohbet_rihtim'))::integer, 0, '04:00''te eski sohbet anında görünmez olur');
SELECT t.eq((SELECT count(*) FROM public.conversations)::integer, 0, '04:00''te sohbet listesi boşalır');
SELECT t.throws($$INSERT INTO public.messages (conversation_id, body) VALUES (t.id('sohbet_rihtim'), 'Son söz')$$, '42501', '04:00''ten sonra eski sohbete yazılamaz');
SELECT t.throws($$INSERT INTO public.plan_participants (plan_id) VALUES (t.id('plan'))$$, '42501', '04:00''ten sonra plana katılınamaz');
RESET ROLE;
SELECT t.ok(private.purge_expired_nights() >= 4, 'süresi dolan sohbetler silinir');
SELECT t.eq((SELECT count(*) FROM public.conversations WHERE cycle_date < '2026-10-23')::integer, 0, 'eski gecelerden sohbet kalmaz');
SELECT t.eq((SELECT count(*) FROM public.messages WHERE sender_id IN (SELECT id FROM t.ids))::integer, 0, 'mesajlar sohbetle birlikte silinir');
SELECT t.eq((SELECT count(*) FROM public.plans WHERE id = t.id('plan'))::integer, 0, 'planlar sohbetle birlikte silinir');
SELECT t.ok((SELECT count(*) FROM public.check_ins WHERE cycle_date = '2026-10-22') > 0, 'yer bildirimleri kalır (K-16)');
SELECT t.eq((SELECT evidence->>'body' FROM public.reports WHERE target_id = t.id('mesaj')), 'Selam Rıhtım!', 'şikâyet edilen mesaj kanıt olarak kalır');
SELECT t.ok(EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'here-gece-sonu' AND schedule = '* * * * *'), 'silme her dakika çalışacak şekilde kurulu');

DELETE FROM public.blocks;
DELETE FROM public.follows;
