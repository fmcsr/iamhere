-- ── 40 · Paylaşımlar: yer bildirimiyle paylaşım, görünürlük, etiket, beğeni ──

RESET ROLE;
INSERT INTO public.follows (follower_id, followee_id) VALUES
  (t.id('ayse'), t.id('burak')), (t.id('burak'), t.id('ayse')),   -- Ayşe ↔ Burak
  (t.id('ayse'), t.id('deniz')), (t.id('deniz'), t.id('ayse')),   -- Ayşe ↔ Deniz
  (t.id('cem'), t.id('ayse'));                                    -- Cem → Ayşe
SELECT t.at('2026-10-20 22:00+03');
SELECT t.login(t.id('burak'));
SELECT t.check_in('rihtim');
SELECT t.login(t.id('cem'));
SELECT t.check_in('rihtim');
SELECT t.login(t.id('ayse'));
SELECT t.check_in('rihtim');

INSERT INTO public.posts (check_in_id, photo_path, caption)
SELECT id, t.id('ayse') || '/gece-treni.jpg', 'Gece Treni harika'
FROM public.check_ins WHERE user_id = t.id('ayse') AND cycle_date = '2026-10-20' AND left_at IS NULL;
INSERT INTO t.ids SELECT 'paylasim', id FROM public.posts WHERE user_id = t.id('ayse');
SELECT t.eq((SELECT venue_id FROM public.posts WHERE id = t.id('paylasim')), t.id('rihtim'), 'paylaşımın mekânı yer bildiriminden gelir');
SELECT t.throws($$INSERT INTO public.posts (check_in_id, photo_path, caption)
                  SELECT id, t.id('ayse') || '/uzun.jpg', repeat('a', 151) FROM public.check_ins
                  WHERE user_id = t.id('ayse') AND left_at IS NULL AND cycle_date = '2026-10-20'$$,
                '23514', 'yazı en fazla 150 harf (S3)');
SELECT t.throws($$INSERT INTO public.posts (check_in_id, photo_path)
                  SELECT id, t.id('burak') || '/x.jpg' FROM public.check_ins
                  WHERE user_id = t.id('ayse') AND left_at IS NULL AND cycle_date = '2026-10-20'$$,
                '42501', 'başkasının klasöründeki fotoğraf paylaşılamaz', 'photo_not_owned');
SELECT t.throws($$INSERT INTO public.posts (check_in_id, photo_path)
                  SELECT id, t.id('ayse') || '/x.jpg' FROM public.check_ins
                  WHERE user_id = t.id('burak') AND cycle_date = '2026-10-20'$$,
                '42501', 'başkasının yer bildirimiyle paylaşılamaz', 'check_in_not_active');
SELECT t.login(t.id('cem'));
SELECT public.leave_venue();
SELECT t.throws($$INSERT INTO public.posts (check_in_id, photo_path)
                  SELECT id, t.id('cem') || '/x.jpg' FROM public.check_ins
                  WHERE user_id = t.id('cem') AND cycle_date = '2026-10-20'$$,
                '42501', 'ayrıldıktan sonra o mekânda paylaşılamaz', 'check_in_not_active');

-- Kim görür: hesabın gizliliği (S2)
SELECT t.login(t.id('deniz'));
SELECT t.eq((SELECT count(*) FROM public.posts WHERE user_id = t.id('ayse'))::integer, 1, 'açık hesabın paylaşımı herkese görünür');
RESET ROLE;
UPDATE public.profiles SET is_private = true WHERE id = t.id('ayse');
DELETE FROM public.follows WHERE follower_id = t.id('deniz') AND followee_id = t.id('ayse');
SELECT t.login(t.id('deniz'));
SELECT t.eq((SELECT count(*) FROM public.posts WHERE user_id = t.id('ayse'))::integer, 0, 'gizli hesabın paylaşımı takip etmeyene görünmez');
SELECT t.eq((SELECT public.post_count(p) FROM public.profiles p WHERE p.id = t.id('ayse')), 1, 'paylaşım sayısı gizli hesapta da görünür');
SELECT t.eq(private.can_see_post_photo(t.id('ayse') || '/gece-treni.jpg'), false, 'gizli hesabın fotoğrafı da açılmaz');
SELECT t.throws($$INSERT INTO public.post_likes (post_id) VALUES (t.id('paylasim'))$$, '42501', 'göremediği paylaşımı beğenemez');
SELECT t.login(t.id('cem'));
SELECT t.eq((SELECT count(*) FROM public.posts WHERE user_id = t.id('ayse'))::integer, 1, 'onaylı takipçi gizli hesabın paylaşımını görür');
SELECT t.eq(private.can_see_post_photo(t.id('ayse') || '/gece-treni.jpg'), true, 'onaylı takipçi fotoğrafı açar');
RESET ROLE;
UPDATE public.profiles SET is_private = false WHERE id = t.id('ayse');
INSERT INTO public.follows (follower_id, followee_id) VALUES (t.id('deniz'), t.id('ayse'));

-- "Kimlerle?" etiketi (S3)
SELECT t.login(t.id('ayse'));
INSERT INTO public.post_tags (post_id, user_id) VALUES (t.id('paylasim'), t.id('burak'));
SELECT t.eq((SELECT count(*) FROM public.post_tags WHERE post_id = t.id('paylasim'))::integer, 1, 'aynı gece aynı mekândaki karşılıklı takipleşen etiketlenir');
SELECT t.throws($$INSERT INTO public.post_tags (post_id, user_id) VALUES (t.id('paylasim'), t.id('cem'))$$, '42501', 'karşılıklı takipleşmeyen etiketlenemez');
SELECT t.throws($$INSERT INTO public.post_tags (post_id, user_id) VALUES (t.id('paylasim'), t.id('deniz'))$$, '42501', 'o gece mekânda olmayan etiketlenemez');
SELECT t.login(t.id('burak'));
SELECT t.throws($$INSERT INTO public.post_tags (post_id, user_id) VALUES (t.id('paylasim'), t.id('burak'))$$, '42501', 'başkasının paylaşımına etiket eklenemez');
DELETE FROM public.post_tags WHERE post_id = t.id('paylasim') AND user_id = t.id('burak');
SELECT t.eq((SELECT count(*) FROM public.post_tags WHERE post_id = t.id('paylasim'))::integer, 0, 'etiketlenen etiketi kaldırabilir');

-- Beğeni (betada yorum yok)
SELECT t.login(t.id('deniz'));
INSERT INTO public.post_likes (post_id) VALUES (t.id('paylasim'));
SELECT t.eq((SELECT public.like_count(p) FROM public.posts p WHERE p.id = t.id('paylasim')), 1, 'beğeni sayılır');
SELECT t.eq((SELECT public.liked_by_me(p) FROM public.posts p WHERE p.id = t.id('paylasim')), true, 'beğendiğimi görürüm');
SELECT t.throws($$INSERT INTO public.post_likes (post_id) VALUES (t.id('paylasim'))$$, '23505', 'aynı paylaşım iki kez beğenilmez');

-- Paylaşımı yalnızca sahibi siler
SELECT t.login(t.id('burak'));
DELETE FROM public.posts WHERE id = t.id('paylasim');
SELECT t.eq((SELECT count(*) FROM public.posts WHERE id = t.id('paylasim'))::integer, 1, 'başkasının paylaşımı silinemez');
SELECT t.login(t.id('ayse'));
DELETE FROM public.posts WHERE id = t.id('paylasim');
SELECT t.eq((SELECT count(*) FROM public.posts WHERE id = t.id('paylasim'))::integer, 0, 'kişi kendi paylaşımını siler');

RESET ROLE;
DELETE FROM public.follows;
