# HERE

Konum bazlı, grup aktivitelerine odaklı sosyal uygulama. Bulunduğun mekânda yer bildir, fotoğraf ya da yorum paylaş, orada olanlarla mekânın grup sohbetine katıl. Sohbetler **her gece 04:00'te** sıfırlanır; paylaşımlar kalır. Prototipte paylaşım, yer bildirirken o an çekilen fotoğraftan ibaret; yorumun ne olacağı açık ([ROTA §14](docs/ROTA.md#14-sıradaki-adım), S3).

Mağaza adı **I am Here** · etiket **#iamhere** · uygulama simgesinde ve içinde **HERE**.

- **Rota, beyin fırtınası ve açık kararlar:** [docs/ROTA.md](docs/ROTA.md)
- Tasarım sistemi, Liquid Glass ilkeleri ve Mobbin araştırması: [docs/TASARIM.md](docs/TASARIM.md)
- Mimari, teknoloji yığını ve klasör yapısı: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Durum

**Adım 1 tamamlandı:** veritabanı şeması, 04:00 → 04:00 silme (TTL) motoru, konum maskeleme ve testler.

| Migration | İçerik |
|---|---|
| `…0001_foundation` | PostGIS, `core` / `ephemeral` şemaları, `anlik_app` rolü |
| `…0002_core_schema` | Kalıcı veri: kullanıcı, kimlik, cihaz, profil, engelleme, şikâyet |
| `…0003_ephemeral_cycle_engine` | Gece hesabı, bölüm açma/düşürme, `run_maintenance()` |
| `…0004_ephemeral_schema` | Gecelik tablolar (persona, konum pini, sohbet, üyelik, mesaj) + RLS |
| `…0005_geo_privacy_discovery` | Izgara maskeleme, mesafe kovaları, yakındaki kişi ve odalar |
| `…0006_moderation` | Şikâyet anında delil kopyası (90 gün) |
| `…0007_scheduler` | pg_cron: dakikada bir bakım turu |

## Mobil prototip (Expo)

`apps/mobile`: Expo SDK 58 + Expo Router. Backend yok; bütün veriler cihaz içindeki sahte veridir (`src/data/mock.ts`).

```bash
cd apps/mobile && npx expo start
```

- **iPhone'da:** App Store'dan Expo Go'yu kur (güncel sürüm), aynı Wi-Fi'da terminaldeki QR kodu iPhone kamerasıyla okut.
- **Simülatörde:** Xcode lisansı bir kez onaylanmalı (`sudo xcodebuild -license accept`), sonra sunucu açıkken `i` tuşuna bas.
- **Geliştirme derlemesi (iOS 27 SDK ve gerçek HERE simgesi):** Xcode 27 ve CocoaPods gerekir. Paket kimliği geçici (`com.iamhere.prototype`); mağazaya çıkmadan değiştirilmeli. iOS 27.1 simülatörü yalnızca katlanabilir iPhone Duo'yu destekliyor; standart iPhone için iOS 27.0'daki iPhone 18 Pro kullanılır.

  ```bash
  cd apps/mobile && npx expo run:ios --device "iPhone 18 Pro"
  ```

  Yerel kodlu yeni bir paket eklendiğinde (ör. 17.10.2026'da expo-blur, masked-view, AsyncStorage, segmented-control) derleme yeniden alınmalı; eski derleme açılışta "AsyncStorage is null" gibi bir hata verir.

- **Logo ve simge:** `apps/mobile/scripts/generate-brand.py` hepsini tek kaynaktan üretir: fuşya balon harfli simge, açılış ekranı ve aşağı çekince dönen logonun 60 karesi (Pillow ve numpy gerekir, yaklaşık bir dakika sürer). HERE simgesi Expo Go'da görünmez; geliştirme veya mağaza derlemesinde görünür.

## Hızlı başlangıç (Docker)

```bash
cp .env.example .env
```

```bash
docker compose up -d --wait
```

```bash
npx dbmate up
```

Testler (depo kökünden):

```bash
PSQL="docker compose exec -T postgres psql -U anlik_owner" ./db/tests/run.sh
```

## Docker olmadan

PostgreSQL 18 ve PostGIS 3.6 yeterlidir; pg_cron isteğe bağlıdır. pg_cron yoksa bakım turunu bir worker'ın dakikada bir çağırması gerekir. Testler standart `PGHOST` / `PGPORT` / `PGUSER` değişkenleriyle bağlanır ve süper kullanıcı ister:

```bash
PGHOST=localhost PGUSER=postgres ./db/tests/run.sh
```

## 04:00'ü elle denemek

Yalnızca geliştirme ortamında yapın; zaman yolculuğu üretimde kapalıdır.

```sql
UPDATE ephemeral.config SET allow_time_travel = true;
SET ephemeral.now = '2026-10-17 04:00:01+03';   -- bu oturumun saati
CALL ephemeral.run_maintenance();
SELECT * FROM ephemeral.purge_log ORDER BY id DESC;
```

## Kurallar

- Geçici yeni bir tablo eklerken: `cycle_date` ile bölümle, `ephemeral.cycle_tables` tablosuna kaydet, RLS politikasını ekle. Unutulursa `30_privileges` testi kırılır.
- Fonksiyon oluşturan her migration, GRANT'lerden önce `REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA core, ephemeral FROM PUBLIC;` çalıştırır.
- Konum yalnızca `upsert_presence()` / `create_room()` üzerinden yazılır; ham koordinat log'a, hata mesajına veya tabloya girmez.
