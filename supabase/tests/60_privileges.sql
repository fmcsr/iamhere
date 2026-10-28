-- ── 60 · Yetkiler: oturumsuz erişim yok, gizli şema kapalı, hesap silme ───────

RESET ROLE;
SELECT t.eq((SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity)::integer, 0,
            'public şemasındaki her tabloda RLS açık');
SELECT t.eq((SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname IN ('public', 'private') AND p.prosecdef
               AND NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) AS cfg WHERE cfg LIKE 'search_path=%'))::integer, 0,
            'yetkili (security definer) fonksiyonların hepsinde search_path sabit');
SELECT t.eq((SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname IN ('public', 'private') AND has_function_privilege('anon', p.oid, 'EXECUTE'))::integer, 0,
            'oturumsuz kullanıcı hiçbir fonksiyonu çağıramaz');
SELECT t.eq((SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v')
               AND has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE'))::integer, 0,
            'oturumsuz kullanıcı hiçbir tabloya erişemez');

SELECT set_config('role', 'anon', true);
SELECT t.throws($$SELECT count(*) FROM public.profiles$$, '42501', 'oturumsuz profil okuyamaz');
SELECT t.throws($$SELECT * FROM public.night()$$, '42501', 'oturumsuz gece bilgisini bile alamaz');
SELECT t.throws($$SELECT private.clock()$$, '42501', 'özel şema oturumsuza kapalı');
RESET ROLE;

SELECT t.login(t.id('ayse'));
SELECT t.throws($$SELECT * FROM private.config$$, '42501', 'ayar tablosu uygulamaya kapalı');
SELECT t.throws($$UPDATE private.config SET allow_time_travel = true$$, '42501', 'uygulama saati oynatamaz');
SELECT t.throws($$SELECT private.purge_expired_nights()$$, '42501', 'uygulama silme motorunu çalıştıramaz');
SELECT t.throws($$SELECT * FROM public.venue_accounts$$, '42501', 'mekân hesapları betada kapalı (K-12)');
SELECT t.throws($$INSERT INTO public.venues (name, category, lat, lng) VALUES ('Sahte', 'bar', 41, 29)$$, '42501', 'uygulama mekân ekleyemez');
SELECT t.throws($$INSERT INTO public.conversations (kind, venue_id) VALUES ('venue', t.id('moda'))$$, '42501', 'sohbet doğrudan açılamaz');

-- Hesap silme: giriş kaydıyla birlikte her şey gider (App Store şartı)
SELECT t.login(t.id('deniz'));
SELECT t.check_in('moda');
SELECT public.delete_account();
RESET ROLE;
SELECT t.eq((SELECT count(*) FROM auth.users WHERE id = t.id('deniz'))::integer, 0, 'hesap silinince giriş kaydı silinir');
SELECT t.eq((SELECT count(*) FROM public.profiles WHERE id = t.id('deniz'))::integer, 0, 'profil de silinir');
SELECT t.eq((SELECT count(*) FROM public.check_ins WHERE user_id = t.id('deniz'))::integer, 0, 'yer bildirimleri de silinir');
