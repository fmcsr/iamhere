-- migrate:up
-- ═════════════════════════════════════════════════════════════════════════════
-- 0004 · ephemeral — gece-günü tabloları
--
-- Ortak kurallar (her tablo):
--   * PARTITION BY RANGE (cycle_date) — bir bölüm = bir gece; silme = DROP (bkz. 0003)
--   * cycle_date DEFAULT current_cycle() — istemci göndermez, sunucu saati belirler
--   * Birincil/benzersiz anahtarlar ve FK'ler cycle_date İÇERİR. Sonuç: bir mesaj ancak
--     AYNI gecenin sohbetine yazılabilir; 04:00'ten sonra eski sohbete yazma FK ile reddedilir.
--   * RLS: yalnızca içinde bulunulan gece görünür/yazılabilir (sahip rol RLS'ye tabi değildir;
--     bakım ve SECURITY DEFINER fonksiyonlar cycle_date'i kendileri filtreler).
--   * Bölümlere doğrudan yetki verilmez → RLS üst tabloyu atlayarak delinemez.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TYPE ephemeral.conversation_kind   AS ENUM ('room', 'direct');
-- direct: pending (istek) → active (kabul) | declined.   room: active | closed
CREATE TYPE ephemeral.conversation_status AS ENUM ('pending', 'active', 'declined', 'closed');
CREATE TYPE ephemeral.member_role         AS ENUM ('owner', 'member');
CREATE TYPE ephemeral.message_kind        AS ENUM ('text', 'image', 'location', 'system');


-- Gecelik anonim kimlik ("Uykusuz Baykuş 42"). Gerçek kullanıcı ↔ persona eşlemesi yalnızca
-- sunucuda durur ve gece bitince yok olur → günler arasında izlenebilirlik yoktur.
CREATE TABLE ephemeral.personas (
  cycle_date   date        NOT NULL DEFAULT ephemeral.current_cycle(),
  id           uuid        NOT NULL DEFAULT uuidv7(),
  user_id      uuid        NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  alias        text        NOT NULL CHECK (char_length(alias) BETWEEN 3 AND 40),
  avatar_seed  int         NOT NULL DEFAULT floor(random() * 2147483647)::int,
  created_at   timestamptz NOT NULL DEFAULT ephemeral.clock(),
  PRIMARY KEY (cycle_date, id),
  UNIQUE (cycle_date, user_id),        -- kişi başına gecede tek persona
  UNIQUE (cycle_date, id, user_id)     -- FK hedefi: "persona gerçekten bu kullanıcının mı?"
) PARTITION BY RANGE (cycle_date);


-- Konum pini: kullanıcının bu gecelik MASKELİ konumu. Ham GPS asla saklanmaz; yazma yalnızca
-- ephemeral.upsert_presence() ile (ızgaraya yuvarlayarak) yapılır. presence_ttl boyunca
-- güncellenmeyen pin gece bitmeden silinir.
CREATE TABLE ephemeral.presence (
  cycle_date   date        NOT NULL DEFAULT ephemeral.current_cycle(),
  user_id      uuid        NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  persona_id   uuid,                                -- NULL → gerçek profil, dolu → anonim
  geo          geography(Point, 4326) NOT NULL,     -- ızgara hücresinin merkezi
  cell_m       int         NOT NULL CHECK (cell_m BETWEEN 100 AND 5000),
  status_text  text        CHECK (char_length(status_text) <= 80),   -- "Kahve içecek var mı?"
  updated_at   timestamptz NOT NULL DEFAULT ephemeral.clock(),
  PRIMARY KEY (cycle_date, user_id),
  FOREIGN KEY (cycle_date, persona_id, user_id)
    REFERENCES ephemeral.personas (cycle_date, id, user_id)
) PARTITION BY RANGE (cycle_date);
CREATE INDEX presence_geo_idx ON ephemeral.presence USING gist (geo);


-- Sohbet: harita üzerinde pinlenmiş ODA ya da birebir (direct) konuşma.
CREATE TABLE ephemeral.conversations (
  cycle_date   date        NOT NULL DEFAULT ephemeral.current_cycle(),
  id           uuid        NOT NULL DEFAULT uuidv7(),
  kind         ephemeral.conversation_kind   NOT NULL,
  status       ephemeral.conversation_status NOT NULL DEFAULT 'active',
  created_by   uuid        NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  -- oda: haritadaki pin (maskeli) + görünürlük yarıçapı
  title        text        CHECK (char_length(title) BETWEEN 1 AND 60),
  geo          geography(Point, 4326),
  radius_m     int         CHECK (radius_m BETWEEN 100 AND 5000),
  max_members  int         NOT NULL DEFAULT 50 CHECK (max_members BETWEEN 2 AND 500),
  -- birebir: sıralı kullanıcı çifti → aynı gece aynı iki kişi arasında tek DM
  dm_low       uuid        REFERENCES core.users (id) ON DELETE CASCADE,
  dm_high      uuid        REFERENCES core.users (id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT ephemeral.clock(),
  PRIMARY KEY (cycle_date, id),
  UNIQUE (cycle_date, dm_low, dm_high),
  CONSTRAINT room_shape CHECK (kind <> 'room' OR (
    title IS NOT NULL AND geo IS NOT NULL AND radius_m IS NOT NULL
    AND dm_low IS NULL AND dm_high IS NULL AND status IN ('active', 'closed'))),
  CONSTRAINT direct_shape CHECK (kind <> 'direct' OR (
    dm_low IS NOT NULL AND dm_high IS NOT NULL AND dm_low < dm_high
    AND geo IS NULL AND radius_m IS NULL))
) PARTITION BY RANGE (cycle_date);
CREATE INDEX conversations_room_geo_idx ON ephemeral.conversations USING gist (geo)
  WHERE kind = 'room';


CREATE TABLE ephemeral.conversation_members (
  cycle_date       date        NOT NULL DEFAULT ephemeral.current_cycle(),
  conversation_id  uuid        NOT NULL,
  user_id          uuid        NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  persona_id       uuid,                    -- NULL → gerçek profil; dolu → bu sohbette anonim
  role             ephemeral.member_role NOT NULL DEFAULT 'member',
  joined_at        timestamptz NOT NULL DEFAULT ephemeral.clock(),
  last_read_id     uuid,                    -- okundu imleci (UUIDv7 → zamana göre sıralı)
  left_at          timestamptz,             -- ayrılınca satır silinmez (mesaj FK'si korunur)
  PRIMARY KEY (cycle_date, conversation_id, user_id),
  FOREIGN KEY (cycle_date, conversation_id)
    REFERENCES ephemeral.conversations (cycle_date, id) ON DELETE CASCADE,
  FOREIGN KEY (cycle_date, persona_id, user_id)
    REFERENCES ephemeral.personas (cycle_date, id, user_id)
) PARTITION BY RANGE (cycle_date);
CREATE INDEX conversation_members_user_idx ON ephemeral.conversation_members (user_id);


CREATE TABLE ephemeral.messages (
  cycle_date       date        NOT NULL DEFAULT ephemeral.current_cycle(),
  id               uuid        NOT NULL DEFAULT uuidv7(),   -- zamana göre sıralı → imleçli sayfalama
  conversation_id  uuid        NOT NULL,
  sender_id        uuid        REFERENCES core.users (id) ON DELETE CASCADE,  -- system: NULL
  client_msg_id    uuid,       -- istemcinin tekrar denemesinde çift kaydı önler (idempotency)
  kind             ephemeral.message_kind NOT NULL DEFAULT 'text',
  body             text        CHECK (char_length(body) <= 2000),
  media_key        text,       -- object storage: c/<cycle>/<conversation>/<uuid>.jpg
  geo              geography(Point, 4326),  -- kind='location': kullanıcının BİLEREK seçtiği yer
  reply_to_id      uuid,
  created_at       timestamptz NOT NULL DEFAULT ephemeral.clock(),
  PRIMARY KEY (cycle_date, id),
  UNIQUE (cycle_date, conversation_id, sender_id, client_msg_id),
  FOREIGN KEY (cycle_date, conversation_id)
    REFERENCES ephemeral.conversations (cycle_date, id) ON DELETE CASCADE,
  -- yalnızca üyeler yazabilir (system mesajında sender_id NULL → kontrol atlanır)
  FOREIGN KEY (cycle_date, conversation_id, sender_id)
    REFERENCES ephemeral.conversation_members (cycle_date, conversation_id, user_id),
  CONSTRAINT message_shape CHECK (CASE kind
    WHEN 'text'     THEN sender_id IS NOT NULL AND body IS NOT NULL
                         AND media_key IS NULL AND geo IS NULL
    WHEN 'image'    THEN sender_id IS NOT NULL AND media_key IS NOT NULL AND geo IS NULL
    WHEN 'location' THEN sender_id IS NOT NULL AND geo IS NOT NULL AND media_key IS NULL
    WHEN 'system'   THEN sender_id IS NULL AND body IS NOT NULL
  END)
) PARTITION BY RANGE (cycle_date);
-- Sohbet ekranı: WHERE conversation_id = $1 AND id < $imleç ORDER BY id DESC LIMIT 50
CREATE INDEX messages_conversation_idx ON ephemeral.messages (conversation_id, id);


-- ── 04:00 temizliğine kayıt (drop_order: önce çocuklar) ─────────────────────
INSERT INTO ephemeral.cycle_tables (table_name, drop_order) VALUES
  ('messages',             10),
  ('conversation_members', 20),
  ('presence',             30),
  ('conversations',        40),
  ('personas',             50);


-- ── RLS: yalnızca bu gece ───────────────────────────────────────────────────
-- (SELECT …) sarmalı fonksiyonu sorgu başına BİR kez (InitPlan) çalıştırır ve
-- çalışma zamanında bölüm budamayı (partition pruning) mümkün kılar.
ALTER TABLE ephemeral.personas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ephemeral.presence             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ephemeral.conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ephemeral.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ephemeral.messages             ENABLE ROW LEVEL SECURITY;

CREATE POLICY only_current_cycle ON ephemeral.personas
  USING (cycle_date = (SELECT ephemeral.current_cycle()))
  WITH CHECK (cycle_date = (SELECT ephemeral.current_cycle()));
CREATE POLICY only_current_cycle ON ephemeral.presence
  USING (cycle_date = (SELECT ephemeral.current_cycle()))
  WITH CHECK (cycle_date = (SELECT ephemeral.current_cycle()));
CREATE POLICY only_current_cycle ON ephemeral.conversations
  USING (cycle_date = (SELECT ephemeral.current_cycle()))
  WITH CHECK (cycle_date = (SELECT ephemeral.current_cycle()));
CREATE POLICY only_current_cycle ON ephemeral.conversation_members
  USING (cycle_date = (SELECT ephemeral.current_cycle()))
  WITH CHECK (cycle_date = (SELECT ephemeral.current_cycle()));
CREATE POLICY only_current_cycle ON ephemeral.messages
  USING (cycle_date = (SELECT ephemeral.current_cycle()))
  WITH CHECK (cycle_date = (SELECT ephemeral.current_cycle()));


-- ── Yetkiler ────────────────────────────────────────────────────────────────
-- Kişi bazlı yetkilendirme (kim hangi sohbeti okuyabilir) API katmanındadır; RLS burada
-- yalnızca "zaman" değişmezini garanti eder.
GRANT SELECT, INSERT, UPDATE, DELETE ON ephemeral.conversation_members, ephemeral.messages
  TO anlik_app;
GRANT SELECT ON ephemeral.personas TO anlik_app;                  -- oluşturma: persona_for()
GRANT SELECT, DELETE ON ephemeral.presence TO anlik_app;          -- yazma: upsert_presence()
GRANT SELECT, DELETE, UPDATE (status, title) ON ephemeral.conversations TO anlik_app;
-- DM doğrudan eklenebilir; ODA pini (geo) yalnızca create_room() ile → geo/radius_m hariç:
GRANT INSERT (cycle_date, id, kind, status, created_by, dm_low, dm_high, created_at)
  ON ephemeral.conversations TO anlik_app;


-- Migration biter bitmez uygulama çalışabilsin: bu gece + 3 gece.
SELECT ephemeral.ensure_partitions(ephemeral.current_cycle(), ephemeral.current_cycle() + 3);


-- migrate:down
DELETE FROM ephemeral.cycle_tables
WHERE table_name IN ('messages', 'conversation_members', 'presence', 'conversations', 'personas');
DROP TABLE ephemeral.messages, ephemeral.conversation_members, ephemeral.conversations,
           ephemeral.presence, ephemeral.personas;
DROP TYPE ephemeral.message_kind, ephemeral.member_role,
          ephemeral.conversation_status, ephemeral.conversation_kind;
