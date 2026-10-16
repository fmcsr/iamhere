-- migrate:up
-- ─────────────────────────────────────────────────────────────────────────────
-- 0002 · core — KALICI veri. Burada sohbet içeriği veya konum YOKTUR.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE core.account_status     AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE core.gender             AS ENUM ('female', 'male', 'nonbinary', 'unspecified');
-- Konum maskeleme seviyesi: near ≈ 250 m ızgara, area ≈ 1 km ızgara (bkz. 0005)
CREATE TYPE core.location_precision AS ENUM ('near', 'area');
CREATE TYPE core.report_reason      AS ENUM ('spam', 'harassment', 'hate', 'sexual_content',
                                             'minor_safety', 'violence', 'impersonation', 'other');
CREATE TYPE core.report_status      AS ENUM ('open', 'reviewing', 'actioned', 'dismissed');

CREATE FUNCTION core.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;


CREATE TABLE core.users (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  status          core.account_status NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  -- Son aktiflik bilerek GÜN hassasiyetinde: dakika dakika iz tutmuyoruz.
  last_active_on  date
);

-- Giriş kimlikleri. Telefon numarası düz metin SAKLANMAZ:
--   subject = hex(HMAC-SHA256(PHONE_PEPPER, '+905551112233'))
-- Pepper uygulamanın sırrıdır (DB'de değil). OTP için numara her girişte kullanıcıdan alınır.
CREATE TABLE core.auth_identities (
  provider    text NOT NULL CHECK (provider IN ('phone', 'apple', 'google')),
  subject     text NOT NULL,
  user_id     uuid NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, subject)
);
CREATE INDEX auth_identities_user_idx ON core.auth_identities (user_id);

-- Cihaz = bir uygulama kurulumu: oturum (refresh token) + push token.
CREATE TABLE core.devices (
  id                  uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id             uuid NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  platform            text NOT NULL CHECK (platform IN ('ios', 'android')),
  push_token          text,
  refresh_token_hash  bytea UNIQUE,           -- sha256(refresh token); token'ın kendisi saklanmaz
  created_at          timestamptz NOT NULL DEFAULT now(),
  last_active_on      date,
  revoked_at          timestamptz
);
CREATE INDEX devices_user_idx ON core.devices (user_id) WHERE revoked_at IS NULL;

-- Profil kalıcıdır ve kullanıcının kendi beyanıdır. Anonim mod profili GİZLER, silmez.
CREATE TABLE core.profiles (
  user_id             uuid PRIMARY KEY REFERENCES core.users (id) ON DELETE CASCADE,
  display_name        text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  bio                 text CHECK (char_length(bio) <= 300),
  birth_date          date NOT NULL,          -- 18+ kontrolü API'de; istemciye yalnızca yaş döner
  gender              core.gender NOT NULL DEFAULT 'unspecified',
  avatar_key          text,                   -- kalıcı medya kovasındaki nesne anahtarı
  photo_keys          text[] NOT NULL DEFAULT '{}' CHECK (cardinality(photo_keys) <= 6),
  interests           text[] NOT NULL DEFAULT '{}' CHECK (cardinality(interests) <= 10),
  languages           text[] NOT NULL DEFAULT '{}' CHECK (cardinality(languages) <= 5),
  -- Gizlilik ayarları
  discoverable        boolean NOT NULL DEFAULT true,    -- haritada/listede görünsün mü
  default_anonymous   boolean NOT NULL DEFAULT false,   -- geceye anonim kimlikle mi başlasın
  location_precision  core.location_precision NOT NULL DEFAULT 'near',
  show_age            boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON core.profiles
  FOR EACH ROW EXECUTE FUNCTION core.touch_updated_at();

-- Engellemeler KALICIDIR: gece bitince taciz eden kişi yeniden karşına çıkmamalı.
CREATE TABLE core.blocks (
  blocker_id  uuid NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  blocked_id  uuid NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX blocks_blocked_idx ON core.blocks (blocked_id);

CREATE FUNCTION core.is_blocked_between(a uuid, b uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.blocks
    WHERE (blocker_id = a AND blocked_id = b) OR (blocker_id = b AND blocked_id = a)
  )
$$;

-- Şikâyetler. ephemeral tarafına FK YOK: o veri 04:00'te silinir; bağlam report_evidence'a
-- kopyalanır (bkz. 0006 core.file_report).
CREATE TABLE core.reports (
  id               uuid PRIMARY KEY DEFAULT uuidv7(),
  reporter_id      uuid REFERENCES core.users (id) ON DELETE SET NULL,
  target_user_id   uuid REFERENCES core.users (id) ON DELETE SET NULL,
  reason           core.report_reason NOT NULL,
  note             text CHECK (char_length(note) <= 1000),
  status           core.report_status NOT NULL DEFAULT 'open',
  cycle_date       date,
  conversation_id  uuid,
  message_id       uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at      timestamptz
);
CREATE INDEX reports_open_idx   ON core.reports (created_at) WHERE status IN ('open', 'reviewing');
CREATE INDEX reports_target_idx ON core.reports (target_user_id);

-- Geçiciliğin TEK bilinçli istisnası: şikâyet edilen içerik moderasyon için sınırlı süre
-- saklanır (gizlilik politikasında açıkça yazılmalı). Süre dolunca run_maintenance() siler.
CREATE TABLE core.report_evidence (
  report_id     uuid PRIMARY KEY REFERENCES core.reports (id) ON DELETE CASCADE,
  captured_at   timestamptz NOT NULL DEFAULT now(),
  retain_until  timestamptz NOT NULL,
  payload       jsonb NOT NULL
);
CREATE INDEX report_evidence_retain_idx ON core.report_evidence (retain_until);


REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA core, ephemeral FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  core.users, core.auth_identities, core.devices, core.profiles, core.blocks, core.reports
  TO anlik_app;
GRANT SELECT ON core.report_evidence TO anlik_app;   -- yazma yalnızca core.file_report() ile
GRANT EXECUTE ON FUNCTION core.is_blocked_between(uuid, uuid) TO anlik_app;


-- migrate:down
DROP TABLE core.report_evidence, core.reports, core.blocks, core.profiles,
           core.devices, core.auth_identities, core.users;
DROP FUNCTION core.is_blocked_between(uuid, uuid);
DROP FUNCTION core.touch_updated_at();
DROP TYPE core.report_status, core.report_reason, core.location_precision,
          core.gender, core.account_status;
