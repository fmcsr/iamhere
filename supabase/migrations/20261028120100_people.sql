-- ═════════════════════════════════════════════════════════════════════════════
-- 02 · Kişiler: profil, takip, engelleme ve görünürlük kuralları
--
-- Görünürlük (ROTA §14 S2, S4):
--   • Profil ve geçmiş geceler hesabın gizliliğine uyar: açık hesap herkese, gizli hesap
--     yalnızca onaylı takipçilere. Göremeyen kişi kilitli profil görür; sayılar görünür.
--   • "Şu an burada" (bu geceki yer bildirimi, Burada listesi, profildeki halka) ayrı bir
--     ayara uyar: Herkes / Karşılıklı (varsayılan) / Kimse.
--   • Engelleme iki yönlüdür: engelleyen ve engellenen birbirini hiçbir yerde görmez.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE public.profiles (
  id                  uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  -- K-15: @kullanıcı adı benzersiz; uygulamadaki kural (profile-rules.ts): 3–24 karakter,
  -- küçük harf, rakam, nokta, alt çizgi; nokta başta, sonda ya da art arda olamaz.
  username            text        NOT NULL UNIQUE
                      CHECK (username ~ '^[a-z0-9._]{3,24}$' AND username !~ '(^\.|\.$|\.\.)'),
  display_name        text        NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 30),
  bio                 text        NOT NULL DEFAULT '' CHECK (char_length(bio) <= 150),
  interests           text[]      NOT NULL DEFAULT '{}' CHECK (cardinality(interests) <= 5),
  avatar_path         text,       -- `profiles` deposunda: <kullanıcı>/…
  cover_path          text,
  is_private          boolean     NOT NULL DEFAULT false,
  presence_visibility text        NOT NULL DEFAULT 'mutual'
                      CHECK (presence_visibility IN ('everyone', 'mutual', 'nobody')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- K-03: tek yönlü takip. Gizli hesaba takip isteği gider (pending), kabul edilince accepted.
CREATE TABLE public.follows (
  follower_id uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  followee_id uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
CREATE INDEX follows_followee_idx ON public.follows (followee_id, status);

CREATE TABLE public.blocks (
  blocker_id uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  blocked_id uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX blocks_blocked_idx ON public.blocks (blocked_id);


-- ── Görünürlük fonksiyonları ─────────────────────────────────────────────────
-- Hepsi "ben" olarak auth.uid() kullanır; başka birinin adına soru sorulamaz.

CREATE FUNCTION private.is_blocked(p_other uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p_other)
       OR (b.blocker_id = p_other AND b.blocked_id = auth.uid()))
$$;

CREATE FUNCTION private.i_follow(p_owner uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.follows f
    WHERE f.follower_id = auth.uid() AND f.followee_id = p_owner AND f.status = 'accepted')
$$;

CREATE FUNCTION private.is_mutual(p_other uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.i_follow(p_other) AND EXISTS (
    SELECT 1 FROM public.follows f
    WHERE f.follower_id = p_other AND f.followee_id = auth.uid() AND f.status = 'accepted')
$$;

-- Profil, paylaşımlar ve geçmiş geceler (S2, S4).
CREATE FUNCTION private.can_see_profile(p_owner uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_owner = auth.uid() OR (
    NOT private.is_blocked(p_owner)
    AND (NOT coalesce((SELECT p.is_private FROM public.profiles p WHERE p.id = p_owner), true)
         OR private.i_follow(p_owner)))
$$;

-- Bu geceki konum: Burada listesi, profildeki halka, bu geceki yer bildirimi (S4).
CREATE FUNCTION private.can_see_presence(p_owner uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_owner = auth.uid() OR (
    NOT private.is_blocked(p_owner)
    AND CASE (SELECT p.presence_visibility FROM public.profiles p WHERE p.id = p_owner)
          WHEN 'everyone' THEN true
          WHEN 'mutual'   THEN private.is_mutual(p_owner)
          ELSE false
        END)
$$;


-- ── Tetikleyiciler ───────────────────────────────────────────────────────────

CREATE FUNCTION private.profiles_touch() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.profiles_touch();

-- Hesap herkese açılınca bekleyen takip istekleri kendiliğinden kabul edilir.
CREATE FUNCTION private.profiles_opened() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.follows SET status = 'accepted', accepted_at = now()
  WHERE followee_id = NEW.id AND status = 'pending';
  RETURN NULL;
END $$;

CREATE TRIGGER profiles_opened AFTER UPDATE OF is_private ON public.profiles
  FOR EACH ROW WHEN (OLD.is_private AND NOT NEW.is_private)
  EXECUTE FUNCTION private.profiles_opened();

-- Takibin durumu istemciden gelmez: gizli hesaba istek, açık hesaba doğrudan takip.
CREATE FUNCTION private.follows_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (SELECT p.is_private FROM public.profiles p WHERE p.id = NEW.followee_id) THEN
    NEW.status := 'pending';
    NEW.accepted_at := NULL;
  ELSE
    NEW.status := 'accepted';
    NEW.accepted_at := now();
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER follows_before_insert BEFORE INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION private.follows_before_insert();

-- Güncellemenin tek anlamı isteği kabul etmektir.
CREATE FUNCTION private.follows_before_update() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.follower_id <> OLD.follower_id OR NEW.followee_id <> OLD.followee_id
     OR NOT (OLD.status = 'pending' AND NEW.status = 'accepted') THEN
    RAISE EXCEPTION 'follow_update_not_allowed' USING ERRCODE = '42501';
  END IF;
  NEW.accepted_at := now();
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END $$;

CREATE TRIGGER follows_before_update BEFORE UPDATE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION private.follows_before_update();

-- Engelleyince iki yöndeki takip de biter.
CREATE FUNCTION private.blocks_after_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  DELETE FROM public.follows
  WHERE (follower_id = NEW.blocker_id AND followee_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND followee_id = NEW.blocker_id);
  RETURN NULL;
END $$;

CREATE TRIGGER blocks_after_insert AFTER INSERT ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION private.blocks_after_insert();


-- ── Sayılar ve yardımcılar (API) ─────────────────────────────────────────────
-- Gizli hesapta da sayılar görünür (S4), listeler görünmez. Sayılar profil satırına hesaplanmış
-- alan olarak eklenir: profiles?select=username,follower_count,following_count

CREATE FUNCTION public.follower_count(p public.profiles) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(*)::integer FROM public.follows f WHERE f.followee_id = p.id AND f.status = 'accepted'
$$;

CREATE FUNCTION public.following_count(p public.profiles) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(*)::integer FROM public.follows f WHERE f.follower_id = p.id AND f.status = 'accepted'
$$;

-- Profil düzenlerken "bu ad alınmış mı?" (engellenmiş kişilerin adları da dolu sayılır).
CREATE FUNCTION public.username_available(p_username text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.username = p_username AND p.id <> auth.uid())
$$;


-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks   ENABLE ROW LEVEL SECURITY;

-- Profilin başlığı (ad, fotoğraf, hakkında) gizli hesapta da görünür; içerik ayrı tablolarda.
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (NOT private.is_blocked(id));
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

-- Kendi ilişkilerim her zaman; başkalarınınki, iki taraftan birinin profilini görebiliyorsam.
CREATE POLICY follows_select ON public.follows FOR SELECT TO authenticated
  USING (follower_id = (SELECT auth.uid()) OR followee_id = (SELECT auth.uid())
         OR (status = 'accepted'
             AND (private.can_see_profile(follower_id) OR private.can_see_profile(followee_id))));
CREATE POLICY follows_insert ON public.follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = (SELECT auth.uid()) AND NOT private.is_blocked(followee_id));
-- İsteği yalnızca takip edilen kabul eder.
CREATE POLICY follows_update ON public.follows FOR UPDATE TO authenticated
  USING (followee_id = (SELECT auth.uid())) WITH CHECK (followee_id = (SELECT auth.uid()));
-- Takipten çıkma / isteği geri çekme (takip eden), takipçiyi çıkarma / isteği silme (takip edilen).
CREATE POLICY follows_delete ON public.follows FOR DELETE TO authenticated
  USING (follower_id = (SELECT auth.uid()) OR followee_id = (SELECT auth.uid()));

CREATE POLICY blocks_select ON public.blocks FOR SELECT TO authenticated
  USING (blocker_id = (SELECT auth.uid()));
CREATE POLICY blocks_insert ON public.blocks FOR INSERT TO authenticated
  WITH CHECK (blocker_id = (SELECT auth.uid()));
CREATE POLICY blocks_delete ON public.blocks FOR DELETE TO authenticated
  USING (blocker_id = (SELECT auth.uid()));


-- ── Yetkiler ─────────────────────────────────────────────────────────────────

REVOKE ALL ON public.profiles, public.follows, public.blocks FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, username, display_name, bio, interests, avatar_path, cover_path, is_private, presence_visibility),
      UPDATE (username, display_name, bio, interests, avatar_path, cover_path, is_private, presence_visibility)
  ON public.profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT UPDATE (status) ON public.follows TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  private.is_blocked(uuid), private.can_see_profile(uuid), private.can_see_presence(uuid)
TO authenticated;
GRANT EXECUTE ON FUNCTION
  public.follower_count(public.profiles), public.following_count(public.profiles), public.username_available(text)
TO authenticated;
