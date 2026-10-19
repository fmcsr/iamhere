<p align="center">
  <img src="apps/mobile/assets/images/icon.png" width="112" alt="HERE uygulama simgesi" />
</p>

<h1 align="center">HERE</h1>

<p align="center">
  <b>I am Here · #iamhere</b><br />
  Gece dışarıdayken mekân odaklı sosyal uygulama: bulunduğun yerde yer bildir, orada olanlarla sohbet et.
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="docs/media-kit/README.md">Medya kiti</a> ·
  <a href="docs/ROTA.md">Rota</a> ·
  <a href="docs/TASARIM.md">Tasarım sistemi</a> ·
  <a href="docs/ARCHITECTURE.md">Mimari</a>
</p>

![HERE: iOS 27 prototipinden ekranlar (açık mod, koyu mod, iPhone Duo)](docs/media-kit/here-media-kit.jpg)

## Fikir

Sosyal uygulamaların çoğu kişiler etrafında kurulur; HERE ise **mekânlar ve bu gece** etrafında. Uygulamayı açınca çevrende hangi mekânların canlı olduğunu görürsün: kaç kişi var, arkadaşlarından kim orada, bu gece ne var. Mekâna varınca **yer bildirirsin** (yalnızca mekânın 300 m yakınındayken) ve gerçekten orada olanlarla mekânın **grup sohbetine** katılırsın: plan yap, masa bul, anı paylaş.

Sohbetler bilerek geçicidir: **her sohbet gece 04:00'te sıfırlanır**. Sana kalanlar paylaştığın fotoğraflar ve dışarıda olduğun gecelerin takvimi.

## Öne çıkanlar

- **İğneyi kaydırarak yer bildirme.** Alttan açılan sayfada dikey kaydırıcı: iğneyi aşağı çekince mekâna "saplanır" ve doğrudan mekân sohbetine geçersin. Fotoğraf yalnızca o an kamerayla çekilir.
- **Her gece sıfırlanan mekân sohbetleri.** Mesajlar, planlar ("Ben de varım") ve mesaj istekleri 04:00'te silinir. Geri sayım sohbetin içinde, gözüne sokulmaz.
- **iOS 27'de Liquid Glass.** Öne çıkan "Buradayım" sekmesiyle yerel sekme çubuğu, yer bildirmişken canlı aksesuar, cam sayfalar ve kartlar, `@expo/ui` ile SwiftUI denetimleri, sekme simgesine iOS'un kendisinin çizdiği Instagram tarzı kırmızı nokta.
- **Gecelere göre kurulmuş profil.** Anı takvimi, etiketlendiğin paylaşımlar, gitmek istediğin yerlerin To-HERE listesi (aynı yeri kaydeden arkadaşlarınla) ve klasik bir düzenleme ekranı.
- **İki dil.** Türkçe ve İngilizce, Ayarlar'dan anında değişir: tarih, mesafe, çoğul ekleri ve örnek içerik dahil.
- **Kodla üretilen marka.** Balon HERE logosu kodla çiziliyor (Poisson şişirme, lateks gölgelendirme, aşağı çekip yenilerken dönen kareler için ışın yürütme): [`generate-brand.py`](apps/mobile/scripts/generate-brand.py).
- **Unutmak için tasarlanmış veritabanı.** Sohbet verisi gece gece bölümlenir, 04:00'te satır düzeyi güvenlikle görünmez olur ve `pg_cron` ile bir dakika içinde diskten silinir. Konum ızgaraya maskelenir, ham hâli saklanmaz. Zaman yolculuklu SQL testleri bunu doğrular.

## Teknoloji

| Katman | Bu depodaki prototip | Planlanan |
|---|---|---|
| **Mobil** | Expo SDK 58, React Native 0.88 (New Architecture, React Compiler), Expo Router yerel sekmeleri, Reanimated 4, Gesture Handler, `expo-glass-effect`, `@expo/ui` (SwiftUI), `react-native-maps` | Android cilası |
| **Uygulama verisi** | Sahte veriyle çalışan uygulama içi durum, cihazda saklanan ayarlar (AsyncStorage) | TanStack Query, Socket.IO |
| **API** | — | NestJS (Fastify), Kysely, Zod sözleşmeleri, BullMQ |
| **Veritabanı** | PostgreSQL 18, PostGIS 3.6, `pg_cron`, dbmate migration'ları, SQL testleri | — |
| **Altyapı** | Docker Compose (PostgreSQL + Valkey) | S3 uyumlu depolama, Expo Push |

## Depo

```
apps/mobile/        Expo uygulaması, iOS öncelikli prototip (tamamen sahte veriyle çalışır)
db/                 SQL migration'ları (dbmate) ve zaman yolculuklu testler
infra/docker/       PostgreSQL + PostGIS + pg_cron imajı
docs/               rota, tasarım sistemi ve mimari · medya kiti (İngilizce)
```

## Çalıştırma

### Mobil prototip

Node 22, iOS 27 simülatörlü Xcode 27 ve CocoaPods gerekir. Uygulama yerel modüller kullandığı için Expo Go'da değil, geliştirme derlemesi olarak çalışır. Backend gerekmez.

```bash
cd apps/mobile
npm install
npx expo run:ios --device "iPhone 18 Pro"
```

- Dil: **Ayarlar › Dil** (Sistem / Türkçe / English).
- Paket kimliği geçici (`com.iamhere.prototype`); mağazaya çıkmadan değiştirilmeli.
- iOS 27.1 simülatörü yalnızca katlanabilir iPhone Duo'yu destekliyor; standart iPhone için iOS 27.0'daki iPhone 18 Pro kullanılır.
- Yerel kodlu yeni bir paket ya da `app.json`'da değişiklik olduğunda derleme yeniden alınmalı (`npx expo prebuild` ve `npx expo run:ios`).
- Ayrıntılar: [apps/mobile/README.md](apps/mobile/README.md).

### Veritabanı (Docker)

```bash
cp .env.example .env
docker compose up -d --wait
npx dbmate up
PSQL="docker compose exec -T postgres psql -U anlik_owner" ./db/tests/run.sh
```

Docker olmadan PostgreSQL 18 ve PostGIS 3.6 yeterlidir; pg_cron isteğe bağlıdır. pg_cron yoksa bakım turunu bir worker'ın dakikada bir çağırması gerekir. Testler standart `PGHOST` / `PGPORT` / `PGUSER` değişkenleriyle bağlanır ve süper kullanıcı ister:

```bash
PGHOST=localhost PGUSER=postgres ./db/tests/run.sh
```

### 04:00'ü elle denemek

Yalnızca geliştirme ortamında yapın; zaman yolculuğu üretimde kapalıdır.

```sql
UPDATE ephemeral.config SET allow_time_travel = true;
SET ephemeral.now = '2026-10-17 04:00:01+03';   -- bu oturumun saati
CALL ephemeral.run_maintenance();
SELECT * FROM ephemeral.purge_log ORDER BY id DESC;
```

Veritabanı kuralları ve migration'lar: [db/README.md](db/README.md).

## Durum

| Bölüm | Durum |
|---|---|
| iOS uygulaması | Temel döngü sahte veriyle baştan sona çalışıyor: keşfet, yer bildir, sohbet et, plan yap, profil, ayarlar, iki dil |
| Veritabanı | Gece silme motoru, konum gizliliği, moderasyon ve zamanlayıcı yazıldı ve test edildi; kalıcı paylaşımlar için şema güncellemesi bekliyor |
| API ve gerçek zamanlı katman | Tasarlandı ([mimari](docs/ARCHITECTURE.md)), henüz yazılmadı |
| Açık ürün soruları | [Rota](docs/ROTA.md#14-sıradaki-adım) §14'te |

Ürün, tasarım ve mimari kararları alındıkça kaydedilir: rotada K-xx, tasarım sisteminde T-xx.

## Lisans

Telif hakkı © 2026 HERE. Tüm hakları saklıdır. Bu depo portfolyo olarak paylaşılmaktadır; kod, tasarımlar ve marka izin alınmadan kullanılamaz.
