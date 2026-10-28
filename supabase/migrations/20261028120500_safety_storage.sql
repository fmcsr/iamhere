-- ═════════════════════════════════════════════════════════════════════════════
-- 06 · Güvenlik ve dosyalar: şikâyet, fotoğraf depoları, hesap silme
--
--   • Şikâyet edilen mesaj 04:00'te silinse de moderasyon görebilsin diye şikâyet anındaki
--     içerik kanıt olarak saklanır. Şikâyetleri yalnızca panel (yönetici) okur.
--   • Fotoğraflar iki depoda: `profiles` (profil ve kapak fotoğrafı, bağlantıyla açılır) ve
--     `posts` (paylaşım fotoğrafları; yalnızca paylaşımı görebilen açar). Herkes yalnızca kendi
--     klasörüne (<kullanıcı kimliği>/…) yükler.
--   • Hesap silme uygulamanın içinden yapılabilir (App Store şartı); bütün kayıtlar silinir.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE public.reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid        NOT NULL DEFAULT auth.uid() REFERENCES public.profiles (id) ON DELETE CASCADE,
  target_kind text        NOT NULL CHECK (target_kind IN ('user', 'post', 'message', 'venue')),
  target_id   uuid        NOT NULL,
  reason      text        NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 1 AND 40),
  note        text        NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  evidence    jsonb,      -- şikâyet anındaki içerik (tetikleyici doldurur)
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_reporter_idx ON public.reports (reporter_id);
CREATE INDEX reports_target_idx ON public.reports (target_kind, target_id);

-- Kanıt yalnızca şikâyet edenin görebildiği içerikten alınır.
CREATE FUNCTION private.reports_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  NEW.evidence := CASE NEW.target_kind
    WHEN 'message' THEN (
      SELECT jsonb_build_object('body', m.body, 'sender_id', m.sender_id, 'conversation_kind', c.kind,
                                'venue_id', c.venue_id, 'sent_at', m.created_at)
      FROM public.messages m JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = NEW.target_id AND private.can_read_conversation(m.conversation_id))
    WHEN 'post' THEN (
      SELECT jsonb_build_object('user_id', p.user_id, 'photo_path', p.photo_path, 'caption', p.caption,
                                'venue_id', p.venue_id)
      FROM public.posts p WHERE p.id = NEW.target_id AND private.can_see_profile(p.user_id))
    WHEN 'user' THEN (
      SELECT jsonb_build_object('username', p.username, 'display_name', p.display_name, 'bio', p.bio,
                                'avatar_path', p.avatar_path)
      FROM public.profiles p WHERE p.id = NEW.target_id)
  END;
  NEW.created_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER reports_before_insert BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION private.reports_before_insert();

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_insert ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));

REVOKE ALL ON public.reports FROM anon, authenticated;
GRANT INSERT (target_kind, target_id, reason, note) ON public.reports TO authenticated;


-- ── Fotoğraf depoları ────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profiles', 'profiles', true,  5242880,  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp']),
  ('posts',    'posts',    false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE FUNCTION private.can_see_post_photo(p_path text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.posts p WHERE p.photo_path = p_path AND private.can_see_profile(p.user_id))
$$;

CREATE POLICY "profiles: kendi klasörüne yükler" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "profiles: kendi dosyasını değiştirir" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "profiles: kendi dosyasını siler" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "posts: kendi klasörüne yükler" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "posts: görebildiği paylaşımın fotoğrafını açar" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'posts' AND ((storage.foldername(name))[1] = (SELECT auth.uid())::text
                                  OR private.can_see_post_photo(name)));
CREATE POLICY "posts: kendi dosyasını siler" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);


-- ── Hesap silme (API) ────────────────────────────────────────────────────────
-- Profil, takipler, yer bildirimleri, paylaşımlar, mesajlar: hepsi zincirleme silinir.
-- Depodaki fotoğrafları uygulama bu çağrıdan önce siler (depo SQL ile silinemez).

CREATE FUNCTION public.delete_account() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END $$;


-- ── Yetkiler ─────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_see_post_photo(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account() TO authenticated;
