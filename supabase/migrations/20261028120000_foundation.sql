-- ═════════════════════════════════════════════════════════════════════════════
-- 01 · Temel: eklentiler, özel şema, gece (04:00 → 04:00) hesabı
--
-- Supabase'de uygulama tablolara doğrudan, oturum açmış kullanıcı olarak erişir (rol:
-- authenticated). Bu yüzden her tabloda RLS açıktır; "kim neyi görür, kim neyi yazar"
-- sorusunun cevabı politikalardadır. Politikaların kullandığı yardımcı fonksiyonlar ve
-- gece motoru `private` şemasındadır: bu şema API'ye açılmaz, istemci doğrudan çağıramaz.
--
-- Kalıcı veri (K-16): profil, takip, engelleme, mekân, yer bildirimi, paylaşım.
-- Gecelik veri: sohbetler, mesajlar, planlar. Gece 04:00'te (İstanbul, K-10) anında
-- görünmez olur (RLS), en geç bir dakika içinde silinir (05 · pg_cron).
--
-- KURAL: Her tabloda RLS açılır; anon (oturumsuz) hiçbir tabloya erişemez. Yetkiler her
-- tabloda açıkça verilir, Supabase'in varsayılan "herkese her şey" yetkilerine güvenilmez.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE SCHEMA private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
-- Politikalar oturum açmış kullanıcının yetkisiyle çalışır; içlerinde çağrılan yardımcı
-- fonksiyonlara ulaşabilmesi için şemayı görmesi gerekir. API yalnızca `public` şemasını sunar.
GRANT USAGE ON SCHEMA private TO authenticated;


-- ── Ayar ─────────────────────────────────────────────────────────────────────

-- Tek satırlık ayar tablosu. cycle_tz / cycle_start canlıda değiştirilmemeli (o anki gecenin
-- sınırını kaydırır).
CREATE TABLE private.config (
  singleton         boolean  PRIMARY KEY DEFAULT true CHECK (singleton),
  cycle_tz          text     NOT NULL DEFAULT 'Europe/Istanbul'
                    -- geçersiz saat dilimi adı bu ifadede hata fırlatır
                    CHECK ((timestamptz '2000-01-01 00:00Z' AT TIME ZONE cycle_tz) IS NOT NULL),
  cycle_start       time     NOT NULL DEFAULT '04:00',
  -- K-06: mekândaki canlı sayı son 3 saatte yer bildirenleri (ve "Hâlâ buradayım" diyenleri) sayar.
  live_window       interval NOT NULL DEFAULT '3 hours',
  -- K-08: kişi başına bir gecede gönderilebilecek mesaj isteği.
  daily_requests    integer  NOT NULL DEFAULT 20 CHECK (daily_requests > 0),
  -- Yalnızca testler: true iken `SET here.now = '…'` saati değiştirir. Testler bunu kendi
  -- işlemlerinde açar ve sonunda geri alır.
  allow_time_travel boolean  NOT NULL DEFAULT false
);
INSERT INTO private.config DEFAULT VALUES;
REVOKE ALL ON private.config FROM PUBLIC;


-- ── Saat ve gece hesabı ──────────────────────────────────────────────────────
-- Zamanın tek doğruluk kaynağı veritabanıdır: "şu an hangi gece?" ve "sohbet ne zaman
-- sıfırlanacak?" sorularının cevabı buradan gelir; uygulama telefon saatine güvenmez.

CREATE FUNCTION private.clock() RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN c.allow_time_travel
              THEN coalesce(nullif(current_setting('here.now', true), '')::timestamptz, now())
              ELSE now()
         END
  FROM private.config c
$$;

-- Bir anın ait olduğu gece. Örn. 2026-10-17 03:59 (İstanbul) → 2026-10-16 gecesi.
CREATE FUNCTION public.cycle_of(p_at timestamptz) RETURNS date
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT ((p_at AT TIME ZONE c.cycle_tz) - c.cycle_start::interval)::date
  FROM private.config c
$$;

-- Gecenin bittiği (sohbetlerin sıfırlandığı) an: ertesi gün 04:00.
CREATE FUNCTION public.cycle_ends_at(p_cycle date) RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT ((p_cycle + 1) + c.cycle_start) AT TIME ZONE c.cycle_tz
  FROM private.config c
$$;

CREATE FUNCTION public.current_cycle() RETURNS date
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.cycle_of(private.clock())
$$;

-- Uygulamanın geri sayımı ve 03:30 uyarısı (K-10) için: hangi gece, ne zaman bitiyor, sunucu saati.
CREATE FUNCTION public.night()
RETURNS TABLE (cycle date, ends_at timestamptz, server_now timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.current_cycle(), public.cycle_ends_at(public.current_cycle()), private.clock()
$$;


-- ── Yetkiler ─────────────────────────────────────────────────────────────────
-- Fonksiyonlar PostgreSQL'de varsayılan olarak herkese açıktır; her migration sonunda kapatılıp
-- yalnızca gerekenler oturum açmış kullanıcıya verilir.

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.cycle_of(timestamptz), public.cycle_ends_at(date), public.current_cycle(), public.night()
TO authenticated;
