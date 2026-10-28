-- ═════════════════════════════════════════════════════════════════════════════
-- 05 · Sohbetler: mekân sohbeti, birebir mesaj, planlar (gecelik)
--
--   • Mekân sohbeti (K-07): mekân başına gecede tek. `section` kalabalık mekânlar ileride alt
--     sohbetlere bölünebilsin diye baştan var; betada her mekânın tek bölümü (0) olur.
--   • Okuma: bu gece o mekânda yer bildirmiş olmak (ayrılsan da 04:00'e kadar okursun).
--     Yazma: o mekândaki yer bildiriminin hâlâ etkin olması (K-06, K-17).
--   • Birebir mesaj (K-08): ilk mesaj istek olarak gider; karşılıklı takipleşenlerde doğrudan
--     gelen kutusuna düşer. Kabul edilmeden ikinci mesaj yok, ilk mesajda bağlantı yok,
--     engellenen yazamaz. Reddedilen isteği gönderen bilmez.
--   • Hepsi gece 04:00'te sıfırlanır (K-10, K-16): RLS eski geceyi anında gizler, pg_cron her
--     dakika süresi dolan sohbetleri siler (mesajlar ve planlar onlarla birlikte gider).
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE public.conversations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind         text        NOT NULL CHECK (kind IN ('venue', 'direct')),
  cycle_date   date        NOT NULL DEFAULT public.current_cycle(),
  venue_id     uuid        REFERENCES public.venues (id),
  section      smallint    NOT NULL DEFAULT 0,
  requester_id uuid        REFERENCES public.profiles (id) ON DELETE CASCADE,
  recipient_id uuid        REFERENCES public.profiles (id) ON DELETE CASCADE,
  accepted_at  timestamptz,   -- birebir: istek kabul edildi (ya da karşılıklı takipleşiliyordu)
  declined_at  timestamptz,   -- birebir: alıcı isteği sildi; gönderen bunu bilmez
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_shape CHECK (
    (kind = 'venue' AND venue_id IS NOT NULL AND requester_id IS NULL AND recipient_id IS NULL)
    OR (kind = 'direct' AND venue_id IS NULL AND requester_id IS NOT NULL AND recipient_id IS NOT NULL
        AND requester_id <> recipient_id)),
  CONSTRAINT conversations_venue_once UNIQUE (venue_id, section, cycle_date)
);
CREATE UNIQUE INDEX conversations_direct_pair ON public.conversations
  (least(requester_id, recipient_id), greatest(requester_id, recipient_id), cycle_date)
  WHERE kind = 'direct';
CREATE INDEX conversations_cycle_idx ON public.conversations (cycle_date);
CREATE INDEX conversations_requester_idx ON public.conversations (requester_id) WHERE kind = 'direct';
CREATE INDEX conversations_recipient_idx ON public.conversations (recipient_id) WHERE kind = 'direct';

-- Plan (grup aktivitesi): mekân sohbetinde paylaşılan "Ben de varım" kartı. Saati 04:00'ü geçemez.
CREATE TABLE public.plans (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  creator_id      uuid        NOT NULL DEFAULT auth.uid() REFERENCES public.profiles (id) ON DELETE CASCADE,
  emoji           text        NOT NULL DEFAULT '📍' CHECK (char_length(emoji) BETWEEN 1 AND 8),
  title           text        NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 60),
  place           text        NOT NULL DEFAULT '' CHECK (char_length(place) <= 60),
  starts_at       timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plans_conversation_idx ON public.plans (conversation_id);
CREATE INDEX plans_creator_idx ON public.plans (creator_id);

CREATE TABLE public.plan_participants (
  plan_id    uuid        NOT NULL REFERENCES public.plans (id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL DEFAULT auth.uid() REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, user_id)
);
CREATE INDEX plan_participants_user_idx ON public.plan_participants (user_id);

CREATE TABLE public.messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL DEFAULT auth.uid() REFERENCES public.profiles (id) ON DELETE CASCADE,
  body            text        NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 1000),
  plan_id         uuid        REFERENCES public.plans (id) ON DELETE CASCADE,   -- plan kartı
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at);
CREATE INDEX messages_sender_idx ON public.messages (sender_id);
CREATE INDEX messages_plan_idx ON public.messages (plan_id) WHERE plan_id IS NOT NULL;


-- ── Okuma ve yazma hakkı ─────────────────────────────────────────────────────

CREATE FUNCTION private.can_read_conversation(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = p_id AND c.cycle_date = public.current_cycle()
      AND CASE c.kind
            WHEN 'venue' THEN EXISTS (
              SELECT 1 FROM public.check_ins ci
              WHERE ci.user_id = auth.uid() AND ci.venue_id = c.venue_id AND ci.cycle_date = c.cycle_date)
            ELSE c.requester_id = auth.uid() OR (c.recipient_id = auth.uid() AND c.declined_at IS NULL)
          END)
$$;

CREATE FUNCTION private.can_write_conversation(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = p_id AND c.cycle_date = public.current_cycle()
      AND CASE c.kind
            WHEN 'venue' THEN EXISTS (
              SELECT 1 FROM public.check_ins ci
              WHERE ci.user_id = auth.uid() AND ci.venue_id = c.venue_id AND ci.cycle_date = c.cycle_date
                AND ci.left_at IS NULL)
            ELSE c.accepted_at IS NOT NULL AND c.declined_at IS NULL
                 AND auth.uid() IN (c.requester_id, c.recipient_id)
                 AND NOT private.is_blocked(
                   CASE WHEN c.requester_id = auth.uid() THEN c.recipient_id ELSE c.requester_id END)
          END)
$$;

CREATE FUNCTION private.can_read_plan(p_plan_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.plans p WHERE p.id = p_plan_id AND private.can_read_conversation(p.conversation_id))
$$;

CREATE FUNCTION private.can_write_plan(p_plan_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.plans p WHERE p.id = p_plan_id AND private.can_write_conversation(p.conversation_id))
$$;


-- ── Tetikleyiciler ───────────────────────────────────────────────────────────

-- Bir mekânda gecenin ilk yer bildirimi o gecenin mekân sohbetini açar.
CREATE FUNCTION private.check_ins_open_chat() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.conversations (kind, venue_id, cycle_date)
  VALUES ('venue', NEW.venue_id, NEW.cycle_date)
  ON CONFLICT (venue_id, section, cycle_date) DO NOTHING;
  RETURN NULL;
END $$;

CREATE TRIGGER check_ins_open_chat AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION private.check_ins_open_chat();

-- Mesajın zamanı sunucudan gelir.
CREATE FUNCTION private.messages_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  NEW.created_at := private.clock();
  RETURN NEW;
END $$;

CREATE TRIGGER messages_before_insert BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION private.messages_before_insert();

-- Plan yalnızca mekân sohbetinde ve gece bitmeden başlar.
CREATE FUNCTION private.plans_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_conversation public.conversations;
BEGIN
  SELECT * INTO v_conversation FROM public.conversations WHERE id = NEW.conversation_id;
  IF v_conversation.kind IS DISTINCT FROM 'venue' THEN
    RAISE EXCEPTION 'plan_needs_venue_chat' USING ERRCODE = '22023';
  END IF;
  IF NEW.starts_at > public.cycle_ends_at(v_conversation.cycle_date) THEN
    RAISE EXCEPTION 'plan_after_night' USING ERRCODE = '22023';
  END IF;
  NEW.created_at := private.clock();
  RETURN NEW;
END $$;

CREATE TRIGGER plans_before_insert BEFORE INSERT ON public.plans
  FOR EACH ROW EXECUTE FUNCTION private.plans_before_insert();

-- Planı kuran katılır; plan sohbette kart olarak görünür.
CREATE FUNCTION private.plans_after_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.plan_participants (plan_id, user_id) VALUES (NEW.id, NEW.creator_id);
  INSERT INTO public.messages (conversation_id, sender_id, body, plan_id)
  VALUES (NEW.conversation_id, NEW.creator_id, NEW.title, NEW.id);
  RETURN NULL;
END $$;

CREATE TRIGGER plans_after_insert AFTER INSERT ON public.plans
  FOR EACH ROW EXECUTE FUNCTION private.plans_after_insert();


-- ── Birebir mesaj (API) ──────────────────────────────────────────────────────

-- İlk mesajla birebir sohbet başlatır. Bu gece aynı kişiyle zaten bir sohbet varsa mesaj
-- eklemeden onu döndürür (uygulama oradan devam eder).
CREATE FUNCTION public.start_direct(p_recipient_id uuid, p_body text) RETURNS public.conversations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_cycle date := public.current_cycle();
  v_row   public.conversations;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = '42501';
  END IF;
  IF p_recipient_id = v_uid OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id)
     OR private.is_blocked(p_recipient_id) THEN
    RAISE EXCEPTION 'recipient_unavailable' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_row FROM public.conversations c
  WHERE c.kind = 'direct' AND c.cycle_date = v_cycle
    AND least(c.requester_id, c.recipient_id) = least(v_uid, p_recipient_id)
    AND greatest(c.requester_id, c.recipient_id) = greatest(v_uid, p_recipient_id);
  IF FOUND THEN
    RETURN v_row;
  END IF;

  IF p_body ~* '(https?://|www\.)' THEN
    RAISE EXCEPTION 'link_in_request' USING ERRCODE = '22023';
  END IF;

  IF NOT private.is_mutual(p_recipient_id) AND (
       SELECT count(*) FROM public.conversations c
       WHERE c.kind = 'direct' AND c.cycle_date = v_cycle AND c.requester_id = v_uid
     ) >= (SELECT cfg.daily_requests FROM private.config cfg) THEN
    RAISE EXCEPTION 'request_limit' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.conversations (kind, cycle_date, requester_id, recipient_id, accepted_at)
  VALUES ('direct', v_cycle, v_uid, p_recipient_id,
          CASE WHEN private.is_mutual(p_recipient_id) THEN private.clock() END)
  RETURNING * INTO v_row;
  INSERT INTO public.messages (conversation_id, sender_id, body) VALUES (v_row.id, v_uid, p_body);
  RETURN v_row;
END $$;

CREATE FUNCTION public.accept_request(p_conversation_id uuid) RETURNS public.conversations
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.conversations SET accepted_at = private.clock()
  WHERE id = p_conversation_id AND kind = 'direct' AND recipient_id = auth.uid()
    AND cycle_date = public.current_cycle() AND accepted_at IS NULL AND declined_at IS NULL
  RETURNING *
$$;

CREATE FUNCTION public.decline_request(p_conversation_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.conversations SET declined_at = private.clock()
  WHERE id = p_conversation_id AND kind = 'direct' AND recipient_id = auth.uid()
    AND cycle_date = public.current_cycle() AND accepted_at IS NULL AND declined_at IS NULL
$$;


-- ── 04:00 silme ──────────────────────────────────────────────────────────────

-- Süresi dolan gecelerin sohbetlerini siler; mesajlar, planlar ve katılımlar onlarla gider.
-- Her dakika çalışır: bir tur kaçarsa sonraki telafi eder, saat dilimi hatasına açık değildir.
CREATE FUNCTION private.purge_expired_nights() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM public.conversations WHERE cycle_date < public.current_cycle();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

SELECT cron.schedule('here-gece-sonu', '* * * * *', 'SELECT private.purge_expired_nights()');
-- pg_cron'un kendi çalışma günlüğü büyümesin.
SELECT cron.schedule('here-cron-gunlugu', '17 3 * * *',
  $$DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'$$);


-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_participants ENABLE ROW LEVEL SECURITY;

-- Sohbetler yalnızca yer bildirimiyle ve start_direct() ile açılır; istemci doğrudan yazamaz.
CREATE POLICY conversations_select ON public.conversations FOR SELECT TO authenticated
  USING (private.can_read_conversation(id));

-- Engellediğim (ya da beni engelleyen) kişinin mesajları görünmez.
CREATE POLICY messages_select ON public.messages FOR SELECT TO authenticated
  USING (private.can_read_conversation(conversation_id) AND NOT private.is_blocked(sender_id));
-- Plan kartı yalnızca plan kurulunca tetikleyiciyle eklenir.
CREATE POLICY messages_insert ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid()) AND plan_id IS NULL
              AND private.can_write_conversation(conversation_id));

CREATE POLICY plans_select ON public.plans FOR SELECT TO authenticated
  USING (private.can_read_conversation(conversation_id));
CREATE POLICY plans_insert ON public.plans FOR INSERT TO authenticated
  WITH CHECK (creator_id = (SELECT auth.uid()) AND private.can_write_conversation(conversation_id));
CREATE POLICY plans_delete ON public.plans FOR DELETE TO authenticated
  USING (creator_id = (SELECT auth.uid()));

CREATE POLICY plan_participants_select ON public.plan_participants FOR SELECT TO authenticated
  USING (private.can_read_plan(plan_id));
-- "Ben de varım" yalnızca sohbete yazabilenler için; geri alınabilir.
CREATE POLICY plan_participants_insert ON public.plan_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND private.can_write_plan(plan_id));
CREATE POLICY plan_participants_delete ON public.plan_participants FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));


-- ── Gerçek zamanlı ───────────────────────────────────────────────────────────
-- Uygulama yeni mesajları, planları ve katılımları anında alır; Realtime RLS'e uyar.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages, public.plans, public.plan_participants;
  END IF;
END $$;


-- ── Yetkiler ─────────────────────────────────────────────────────────────────

REVOKE ALL ON public.conversations, public.messages, public.plans, public.plan_participants FROM anon, authenticated;
GRANT SELECT ON public.conversations TO authenticated;
GRANT SELECT ON public.messages TO authenticated;
GRANT INSERT (conversation_id, body) ON public.messages TO authenticated;
GRANT SELECT, DELETE ON public.plans TO authenticated;
GRANT INSERT (conversation_id, emoji, title, place, starts_at) ON public.plans TO authenticated;
GRANT SELECT, DELETE ON public.plan_participants TO authenticated;
GRANT INSERT (plan_id) ON public.plan_participants TO authenticated;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  private.can_read_conversation(uuid), private.can_write_conversation(uuid),
  private.can_read_plan(uuid), private.can_write_plan(uuid)
TO authenticated;
GRANT EXECUTE ON FUNCTION
  public.start_direct(uuid, text), public.accept_request(uuid), public.decline_request(uuid)
TO authenticated;
