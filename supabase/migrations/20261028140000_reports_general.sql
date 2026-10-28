-- ═════════════════════════════════════════════════════════════════════════════
-- 07 · Ekibe bildir: genel bildirim ve takip durumu
--
--   • "Ekibe bildir" (Ayarlar › Güvenlik): bir mesaja ya da paylaşıma bağlı olmayan durumlar; ör. engellediğin
--     biri başka bir hesaptan rahatsız etmeye devam ediyor. Hedefi yok (target_kind 'other'); istenirse ilgili
--     kişinin kullanıcı adı yazılır ve o anki profili kanıt olarak saklanır.
--   • Ekip bildirimleri panelde durumuyla takip eder: yeni → inceleniyor → kapandı. Durumu uygulama değiştiremez.
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.reports DROP CONSTRAINT reports_target_kind_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_target_kind_check
  CHECK (target_kind IN ('user', 'post', 'message', 'venue', 'other'));
ALTER TABLE public.reports ALTER COLUMN target_id DROP NOT NULL;
-- Genel bildirimin hedefi yok; diğerlerinin hep var.
ALTER TABLE public.reports ADD CONSTRAINT reports_target_present CHECK ((target_kind = 'other') = (target_id IS NULL));
ALTER TABLE public.reports
  ADD COLUMN reported_username text CHECK (char_length(reported_username) <= 40),
  ADD COLUMN status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'closed')),
  ADD COLUMN resolved_at timestamptz;
-- Ekibin açık bildirim listesi.
CREATE INDEX reports_open_idx ON public.reports (created_at) WHERE status <> 'closed';

-- Kanıt yalnızca şikâyet edenin görebildiği içerikten alınır; genel bildirimde adı verilen hesabın o anki profili.
CREATE OR REPLACE FUNCTION private.reports_before_insert() RETURNS trigger
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
    WHEN 'other' THEN (
      SELECT jsonb_build_object('user_id', p.id, 'username', p.username, 'display_name', p.display_name, 'bio', p.bio)
      FROM public.profiles p WHERE p.username = lower(ltrim(btrim(NEW.reported_username), '@')))
  END;
  NEW.created_at := now();
  RETURN NEW;
END $$;

GRANT INSERT (reported_username) ON public.reports TO authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
