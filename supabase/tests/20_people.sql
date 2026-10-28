-- ── 20 · Kişiler: profil kuralları, takip, engelleme, görünürlük ─────────────

RESET ROLE;
SELECT t.login(t.id('ayse'));

-- Profil kuralları (uygulamadaki profile-rules.ts ile aynı)
SELECT t.throws($$UPDATE public.profiles SET username = 'ay' WHERE id = t.id('ayse')$$, '23514', 'kullanıcı adı en az 3 karakter');
SELECT t.throws($$UPDATE public.profiles SET username = 'Ayse' WHERE id = t.id('ayse')$$, '23514', 'kullanıcı adında büyük harf yok');
SELECT t.throws($$UPDATE public.profiles SET username = '.ayse' WHERE id = t.id('ayse')$$, '23514', 'nokta başta olamaz');
SELECT t.throws($$UPDATE public.profiles SET username = 'ay..se' WHERE id = t.id('ayse')$$, '23514', 'art arda nokta olamaz');
SELECT t.throws($$UPDATE public.profiles SET username = 'burak' WHERE id = t.id('ayse')$$, '23505', 'alınmış kullanıcı adı reddedilir');
SELECT t.eq(public.username_available('burak'), false, 'username_available: alınmış ad');
SELECT t.eq(public.username_available('ayse'), true, 'username_available: kendi adım dolu sayılmaz');
SELECT t.throws($$UPDATE public.profiles SET bio = repeat('a', 151) WHERE id = t.id('ayse')$$, '23514', 'hakkında en fazla 150 harf');
SELECT t.throws($$UPDATE public.profiles SET interests = ARRAY['a', 'b', 'c', 'd', 'e', 'f'] WHERE id = t.id('ayse')$$, '23514', 'en fazla 5 ilgi alanı');
SELECT t.throws($$UPDATE public.profiles SET created_at = now() WHERE id = t.id('ayse')$$, '42501', 'kayıt tarihi değiştirilemez');
SELECT t.throws($$INSERT INTO public.profiles (id, username, display_name) VALUES (t.id('burak'), 'sahte', 'Sahte')$$, '42501', 'başkası adına profil açılamaz');
UPDATE public.profiles SET display_name = 'Ele geçirildi' WHERE id = t.id('burak');
RESET ROLE;
SELECT t.eq((SELECT display_name FROM public.profiles WHERE id = t.id('burak')), 'Burak', 'başkasının profili değiştirilemez');

-- Takip: açık hesaba doğrudan, gizli hesaba istek (K-03)
SELECT t.login(t.id('ayse'));
INSERT INTO public.follows (follower_id, followee_id) VALUES (t.id('ayse'), t.id('burak'));
SELECT t.eq((SELECT status FROM public.follows WHERE follower_id = t.id('ayse') AND followee_id = t.id('burak')), 'accepted', 'açık hesabı takip hemen başlar');
SELECT t.throws($$INSERT INTO public.follows (follower_id, followee_id) VALUES (t.id('burak'), t.id('cem'))$$, '42501', 'başkası adına takip edilemez');
RESET ROLE;
UPDATE public.profiles SET is_private = true WHERE id = t.id('cem');
SELECT t.login(t.id('ayse'));
INSERT INTO public.follows (follower_id, followee_id, status) VALUES (t.id('ayse'), t.id('cem'), 'accepted');
SELECT t.eq((SELECT status FROM public.follows WHERE follower_id = t.id('ayse') AND followee_id = t.id('cem')), 'pending', 'gizli hesaba istek gider (durumu istemci seçemez)');
SELECT t.eq(private.can_see_profile(t.id('cem')), false, 'isteği bekleyen gizli profili göremez');
UPDATE public.follows SET status = 'accepted' WHERE follower_id = t.id('ayse') AND followee_id = t.id('cem');
SELECT t.eq((SELECT status FROM public.follows WHERE follower_id = t.id('ayse') AND followee_id = t.id('cem')), 'pending', 'isteği gönderen kendisi kabul edemez');
SELECT t.login(t.id('cem'));
UPDATE public.follows SET status = 'accepted' WHERE follower_id = t.id('ayse') AND followee_id = t.id('cem');
SELECT t.login(t.id('ayse'));
SELECT t.eq(private.can_see_profile(t.id('cem')), true, 'onaylı takipçi gizli profili görür');
SELECT t.login(t.id('deniz'));
SELECT t.eq(private.can_see_profile(t.id('cem')), false, 'takip etmeyen gizli profili göremez');
SELECT t.eq((SELECT public.follower_count(p) FROM public.profiles p WHERE p.id = t.id('cem')), 1, 'gizli hesabın sayıları herkese görünür (S4)');
SELECT t.eq((SELECT count(*) FROM public.profiles WHERE id = t.id('cem'))::integer, 1, 'gizli hesabın başlığı (ad, fotoğraf) görünür');

-- Hesap herkese açılınca bekleyen istekler kabul edilir
INSERT INTO public.follows (follower_id, followee_id) VALUES (t.id('deniz'), t.id('cem'));
SELECT t.login(t.id('cem'));
UPDATE public.profiles SET is_private = false WHERE id = t.id('cem');
SELECT t.eq((SELECT status FROM public.follows WHERE follower_id = t.id('deniz') AND followee_id = t.id('cem')), 'accepted', 'hesap açılınca bekleyen istekler kabul edilir');
SELECT t.throws($$UPDATE public.follows SET status = 'pending' WHERE follower_id = t.id('deniz') AND followee_id = t.id('cem')$$, '42501', 'kabul edilmiş takip geri isteğe dönmez');

-- Engelleme iki yönlü
SELECT t.login(t.id('burak'));
INSERT INTO public.follows (follower_id, followee_id) VALUES (t.id('burak'), t.id('ayse'));
SELECT t.login(t.id('ayse'));
INSERT INTO public.blocks (blocker_id, blocked_id) VALUES (t.id('ayse'), t.id('burak'));
RESET ROLE;
SELECT t.eq((SELECT count(*) FROM public.follows
             WHERE (follower_id = t.id('ayse') AND followee_id = t.id('burak'))
                OR (follower_id = t.id('burak') AND followee_id = t.id('ayse')))::integer, 0, 'engelleyince iki yöndeki takip biter');
SELECT t.login(t.id('burak'));
SELECT t.eq((SELECT count(*) FROM public.profiles WHERE id = t.id('ayse'))::integer, 0, 'engellenen, engelleyeni bulamaz');
SELECT t.eq((SELECT count(*) FROM public.blocks)::integer, 0, 'engellenen, engellendiğini göremez');
SELECT t.throws($$INSERT INTO public.follows (follower_id, followee_id) VALUES (t.id('burak'), t.id('ayse'))$$, '42501', 'engellenen takip edemez');
SELECT t.login(t.id('ayse'));
SELECT t.eq((SELECT count(*) FROM public.profiles WHERE id = t.id('burak'))::integer, 0, 'engelleyen de engellediğini görmez');
DELETE FROM public.blocks WHERE blocker_id = t.id('ayse') AND blocked_id = t.id('burak');
SELECT t.eq((SELECT count(*) FROM public.profiles WHERE id = t.id('burak'))::integer, 1, 'engel kalkınca yeniden görünür');

-- "Şu an burada kimler görsün": Herkes / Karşılıklı (varsayılan) / Kimse (S4)
RESET ROLE;
DELETE FROM public.follows;
INSERT INTO public.follows (follower_id, followee_id) VALUES
  (t.id('ayse'), t.id('burak')), (t.id('burak'), t.id('ayse')), (t.id('cem'), t.id('ayse'));
SELECT t.login(t.id('burak'));
SELECT t.eq(private.can_see_presence(t.id('ayse')), true, 'karşılıklı: karşılıklı takipleşen görür');
SELECT t.login(t.id('cem'));
SELECT t.eq(private.can_see_presence(t.id('ayse')), false, 'karşılıklı: tek yönlü takip eden göremez');
RESET ROLE;
UPDATE public.profiles SET presence_visibility = 'everyone' WHERE id = t.id('ayse');
SELECT t.login(t.id('deniz'));
SELECT t.eq(private.can_see_presence(t.id('ayse')), true, 'herkes: takip etmeyen de görür');
RESET ROLE;
UPDATE public.profiles SET presence_visibility = 'nobody' WHERE id = t.id('ayse');
SELECT t.login(t.id('burak'));
SELECT t.eq(private.can_see_presence(t.id('ayse')), false, 'kimse: karşılıklı takipleşen de göremez');
SELECT t.login(t.id('ayse'));
SELECT t.eq(private.can_see_presence(t.id('ayse')), true, 'kişi kendi konumunu her zaman görür');

RESET ROLE;
UPDATE public.profiles SET presence_visibility = 'mutual', is_private = false;
DELETE FROM public.follows;
