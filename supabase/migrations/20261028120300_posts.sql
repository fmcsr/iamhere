-- ═════════════════════════════════════════════════════════════════════════════
-- 04 · Paylaşımlar (kalıcı, K-16)
--
--   • Paylaşım = fotoğraf + en fazla 150 harf yazı; yalnızca yazıdan oluşan paylaşım yok (S3).
--     Yalnızca o anki etkin yer bildiriminle, bulunduğun mekânda paylaşılır.
--   • Kim görür: hesabın gizliliği (S2). Paylaşım başına kitle seçimi yok.
--   • "Kimlerle?" etiketi: o gece aynı mekânda yer bildirmiş, karşılıklı takipleştiğin kişiler;
--     etiketlenen etiketi kaldırabilir (S3).
--   • Betada yorum yok, yalnızca beğeni (S3). Kişi kendi paylaşımını siler.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE public.posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL DEFAULT auth.uid() REFERENCES public.profiles (id) ON DELETE CASCADE,
  check_in_id uuid        NOT NULL REFERENCES public.check_ins (id) ON DELETE CASCADE,
  -- Mekân ve gece yer bildiriminden kopyalanır (tetikleyici); istemci göndermez.
  venue_id    uuid        NOT NULL REFERENCES public.venues (id),
  cycle_date  date        NOT NULL,
  photo_path  text        NOT NULL CHECK (char_length(photo_path) BETWEEN 1 AND 300),  -- `posts` deposunda
  caption     text        NOT NULL DEFAULT '' CHECK (char_length(caption) <= 150),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_user_idx ON public.posts (user_id, created_at DESC);
CREATE INDEX posts_venue_idx ON public.posts (venue_id, cycle_date, created_at DESC);
CREATE INDEX posts_check_in_idx ON public.posts (check_in_id);

CREATE TABLE public.post_tags (
  post_id    uuid        NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX post_tags_user_idx ON public.post_tags (user_id, created_at DESC);

CREATE TABLE public.post_likes (
  post_id    uuid        NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL DEFAULT auth.uid() REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX post_likes_user_idx ON public.post_likes (user_id);


-- ── Kurallar ─────────────────────────────────────────────────────────────────

-- Paylaşım yalnızca kişinin bu geceki etkin yer bildirimine bağlanır; fotoğraf kendi klasöründe olmalı.
CREATE FUNCTION private.posts_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_check_in public.check_ins;
BEGIN
  SELECT * INTO v_check_in FROM public.check_ins WHERE id = NEW.check_in_id;
  IF NOT FOUND OR v_check_in.user_id IS DISTINCT FROM NEW.user_id
     OR v_check_in.cycle_date <> public.current_cycle() OR v_check_in.left_at IS NOT NULL THEN
    RAISE EXCEPTION 'check_in_not_active' USING ERRCODE = '42501';
  END IF;
  IF NEW.photo_path NOT LIKE NEW.user_id::text || '/%' THEN
    RAISE EXCEPTION 'photo_not_owned' USING ERRCODE = '42501';
  END IF;
  NEW.venue_id := v_check_in.venue_id;
  NEW.cycle_date := v_check_in.cycle_date;
  NEW.created_at := private.clock();
  RETURN NEW;
END $$;

CREATE TRIGGER posts_before_insert BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION private.posts_before_insert();

CREATE FUNCTION private.can_see_post(p_post_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.posts p WHERE p.id = p_post_id AND private.can_see_profile(p.user_id))
$$;

-- Etiket: paylaşım benim; etiketlenen o gece aynı mekânda yer bildirmiş ve karşılıklı takipleşiyoruz.
CREATE FUNCTION private.can_tag(p_post_id uuid, p_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = p_post_id AND p.user_id = auth.uid() AND p_user_id <> auth.uid()
      AND private.is_mutual(p_user_id)
      AND NOT private.is_blocked(p_user_id)
      AND EXISTS (SELECT 1 FROM public.check_ins c
                  WHERE c.user_id = p_user_id AND c.venue_id = p.venue_id AND c.cycle_date = p.cycle_date))
$$;

CREATE FUNCTION private.owns_post(p_post_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.posts p WHERE p.id = p_post_id AND p.user_id = auth.uid())
$$;


-- ── Sayılar (API) ────────────────────────────────────────────────────────────

-- posts?select=*,like_count,liked_by_me
CREATE FUNCTION public.like_count(p public.posts) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(*)::integer FROM public.post_likes l WHERE l.post_id = p.id
$$;

CREATE FUNCTION public.liked_by_me(p public.posts) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.post_likes l WHERE l.post_id = p.id AND l.user_id = auth.uid())
$$;

-- Profil sayıları gizli hesapta da görünür (S4): paylaşım sayısı ve gece (anı) sayısı.
CREATE FUNCTION public.post_count(p public.profiles) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(*)::integer FROM public.posts x WHERE x.user_id = p.id
$$;

CREATE FUNCTION public.night_count(p public.profiles) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(DISTINCT c.cycle_date)::integer FROM public.check_ins c WHERE c.user_id = p.id
$$;


-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY posts_select ON public.posts FOR SELECT TO authenticated
  USING (private.can_see_profile(user_id));
CREATE POLICY posts_insert ON public.posts FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY posts_delete ON public.posts FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY post_tags_select ON public.post_tags FOR SELECT TO authenticated
  USING (private.can_see_post(post_id));
CREATE POLICY post_tags_insert ON public.post_tags FOR INSERT TO authenticated
  WITH CHECK (private.can_tag(post_id, user_id));
-- Etiketi paylaşan da, etiketlenen de kaldırabilir.
CREATE POLICY post_tags_delete ON public.post_tags FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.owns_post(post_id));

CREATE POLICY post_likes_select ON public.post_likes FOR SELECT TO authenticated
  USING (private.can_see_post(post_id));
CREATE POLICY post_likes_insert ON public.post_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND private.can_see_post(post_id));
CREATE POLICY post_likes_delete ON public.post_likes FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));


-- ── Yetkiler ─────────────────────────────────────────────────────────────────

REVOKE ALL ON public.posts, public.post_tags, public.post_likes FROM anon, authenticated;
GRANT SELECT, DELETE ON public.posts TO authenticated;
GRANT INSERT (check_in_id, photo_path, caption) ON public.posts TO authenticated;
GRANT SELECT, DELETE ON public.post_tags TO authenticated;
GRANT INSERT (post_id, user_id) ON public.post_tags TO authenticated;
GRANT SELECT, DELETE ON public.post_likes TO authenticated;
GRANT INSERT (post_id) ON public.post_likes TO authenticated;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  private.can_see_post(uuid), private.can_tag(uuid, uuid), private.owns_post(uuid)
TO authenticated;
GRANT EXECUTE ON FUNCTION
  public.like_count(public.posts), public.liked_by_me(public.posts),
  public.post_count(public.profiles), public.night_count(public.profiles)
TO authenticated;
