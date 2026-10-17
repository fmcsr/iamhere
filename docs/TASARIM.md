# HERE — Tasarım Sistemi ve Mobbin Araştırması

> **Durum:** Uygulanıyor · 16 Ekim 2026 (taslak), 17 Ekim 2026 (T-1…T-10 kabul, ekranlar yeniden tasarlandı; ardından T-11…T-15: gradyan zemin, kayan üst bar, cam kartlar, daha net cam, görünüm ayarı; T-16…T-17: DM Sans, geçirgen paylaşım kartları; **T-18 ve T-19 karar bekliyor**; bkz. §6 ve §7)
> **Kaynak:** Mobbin'de 4 paralel araştırma, toplam 62 arama (iOS). Konular: kayıt ve kimlik · akış, yer bildirimi ve keşif · mesajlaşma · profil, ayarlar ve görsel sistem. Bunlara ek olarak iOS 27 Liquid Glass değişiklikleri ve Expo SDK 58'in yerel bileşenleri incelendi.
> **Adlandırma:** Mağaza adı **I am Here** · etiket **#iamhere** · simgede ve uygulama içinde **HERE** ([ROTA.md K-13](ROTA.md)).
>
> İlgili belgeler: [ROTA.md](ROTA.md) (ürün kararları) · [ARCHITECTURE.md](ARCHITECTURE.md) (teknik mimari)

---

## İçindekiler

1. [Tasarım ilkeleri](#1-tasarım-ilkeleri)
2. [Liquid Glass ve iOS 27](#2-liquid-glass-ve-ios-27)
3. [Renk sistemi](#3-renk-sistemi)
4. [Tipografi, ikonlar ve şekiller](#4-tipografi-ikonlar-ve-şekiller)
5. [Ekran ekran öneriler](#5-ekran-ekran-öneriler)
6. [Raporlar arasındaki çelişkiler ve karar önerileri](#6-raporlar-arasındaki-çelişkiler-ve-karar-önerileri)
7. [Uygulama sırası](#7-uygulama-sırası)
8. [Kaynaklar](#8-kaynaklar)

---

## 1. Tasarım ilkeleri

| # | İlke | Ne demek |
|---|---|---|
| 1 | **Yerel önce** | Sekme çubuğu, başlık çubukları, sayfalar (sheet), segment, buton gibi her şeyi önce iOS'un kendi bileşeniyle yap. iOS 26/27'de bunlar Liquid Glass'ı kendiliğinden alır ve sistemle birlikte güncellenir. Özel bileşen yalnızca yerel karşılığı yoksa yazılır. |
| 2 | **Cam her katmanda, içerik net** | Liquid Glass bol kullanılır: sekme çubuğu, başlıklar, butonlar, sayaç, harita kontrolleri, yazma alanı, sayfalar ve kartlar (paylaşımlar, listeler). Altındaki marka gradyanı camı görünür kılar (§3.6). Fotoğraflar, mesaj balonları ve metin cam değildir; net kalır. Apple camı gezinme katmanına ayırıyor; kartlardaki cam kurucunun isteğiyle verilmiş bilinçli bir sapma (T-13). |
| 3 | **Fuşya = "şimdi / canlı"** | Fuşya ekran başına tek birincil eylemde (Buradayım, Paylaş, Gönder) ve canlı durumlarda (aktif yer bildirimi, "● 48 burada", okunmamış rozeti) kullanılır. Gerisi nötr kalır; gece fotoğrafları zaten renkli. |
| 4 | **Mekân öne çıkar** | Her paylaşımda, her kartta dokunulabilir bir mekân satırı var. Kişiler mekânın içinde görünür (K-02). |
| 5 | **Geçicilik yalnızca sohbette** | 04:00'te yalnızca sohbetler sıfırlanır; paylaşımlar kalır (ROTA K-16). Sayaç ve "her gece 04:00'te sıfırlanır" notu yalnızca sohbetlerde: sohbet başlığında tek satır, ilk girişte tek sistem mesajı, Mesajlar'da tek satır. Paylaşımlarda sayaç ya da "silinir" yazısı yok. |
| 6 | **Gece önce** | Uygulama ağırlıkla gece kullanılacak; koyu mod temel tasarım, açık mod onun eşdeğeri. |
| 7 | **Güvenlik görünür ama sakin** | Bildir ve Engelle her zaman bir dokunuş uzakta (uzun basma, ••• menüsü), ama ekranı işgal etmiyor. |

---

## 2. Liquid Glass ve iOS 27

### 2.1 iOS 27'de ne değişti?

- **Kullanıcı ayarı:** iOS 27'de kullanıcılar Ayarlar'dan camı **daha şeffaf ↔ daha renkli (tinted)** arasında bir kaydırıcıyla ayarlayabiliyor. Tasarımımız iki uçta da okunur olmalı.
- **Okunabilirlik:** Apple camın arkadaki karmaşık içeriği daha iyi bulanıklaştıracak ve daha fazla derinlik/ayrım sağlayacak şekilde ayarlandığını söylüyor; varsayılan şeffaflık da azaltıldı.
- **Kaçış yok:** Haberlere göre iOS 26'da yerel bileşenlerin Liquid Glass görünümünü kapatmaya yarayan ayar (`UIDesignRequiresCompatibility`), **Xcode 27 ile derlenen uygulamalarda artık çalışmıyor.** Yani camla uyumlu tasarlamak tercih değil, zorunluluk.
- **Simgeler:** Uygulama simgeleri daha tanınır olacak şekilde yeniden düzenlendi. HERE simgesi bu yüzden Apple'ın katmanlı simge biçiminde (Icon Composer `.icon`) hazırlandı: fuşya zemin + beyaz HERE logo katmanı. Cam ışığını ve koyu/renkli/şeffaf varyantları sistem üretir.

Bu Mac'te **Xcode 27.1** ve **iOS 27.1 simülatörü** kurulu; tüm ekranlar iOS 27 üzerinde test edilecek. iOS 27.1 simülatörü yalnızca katlanabilir **iPhone Duo** cihazını destekliyor; standart iPhone ekranı için iOS 27.0'daki **iPhone 18 Pro** kullanılır.

### 2.2 HERE'de cam nerede?

| Katman | Öğe | Nasıl (Expo SDK 58) |
|---|---|---|
| Sekme çubuğu | 5 sekme | `NativeTabs` (otomatik cam) + `minimizeBehavior="onScrollDown"`: akışta aşağı kaydırınca küçülür |
| Sekme üstü aksesuar | **"● Rıhtım Açıkhava · ⏳ 4 sa 12 dk"**: yer bildirmişken sekme çubuğunun üstünde yüzen cam kapsül; dokununca mekân sohbeti açılır | `NativeTabs.BottomAccessory` (Apple Music'teki mini oynatıcının yerleşimi) |
| Başlık çubukları | Keşfet, Mesajlar, Profil; sohbet ve mekân sayfaları | Yerel `Stack` başlıkları: büyük başlık (Large Title), cam başlık butonları (çark, paylaş, •••) |
| Ana sayfa üstü | Sabit başlık yok: HERE, sayaç ve segment içerikle birlikte yukarı kayar | Dynamic Island ve durum çubuğunun altında kademeli bulanıklık (`StatusBarBlur`, T-12) |
| Yüzen kontroller | Harita arama alanı ve filtre çipleri, konum butonu | **Net (clear)** `GlassView` (T-14) / birbirine yakın olanlar `GlassContainer` içinde (cam damlaları birleşir) |
| **Kartlar** | Paylaşım kartları · mesaj ve yer bildirimi listeleri, mekân sohbeti önizlemesi, plan kartı | Paylaşımlar: net (`clear`) cam, tonsuz; arkadaki gradyan görünür (`GlassCard translucent`, T-17) · diğer kartlar: `regular` cam + hafif beyaz ton (T-13) |
| Butonlar | Birincil: Buradayım, Paylaş, Kabul et, Takip et | SwiftUI `Button` + `buttonStyle('glassProminent')` + `tint` (`@expo/ui`) |
| | İkincil: Mesaj, Değiştir, Sil | `buttonStyle('glass')` |
| Segment | Sana özel / Rastgele, kitle seçimi | SwiftUI `Picker` + `pickerStyle('segmented')` |
| Sayfalar | Paylaşım, kitle seçimi, yer bildirimi onayı, "Burada kimler var" | Yerel `formSheet` + yükseklik durakları (detents); iOS 26+ cam zemin |
| Yazma alanı | Sohbet composer'ı | Mesajların üstünde yüzen cam kapsül, "+" ve gönder ayrı cam daireler |
| **Cam değil** | Fotoğraflar, mesaj balonları, kart içindeki satırlar, ayar satırları | Opak ya da gradyanın rengini alan yarı saydam dolgu (`fill`, bkz. §3) |

### 2.3 Cam kuralları

1. **Cam üstüne cam koyma.** Bir cam sayfanın içindeki buton "glass" değil, düz (plain/bordered) olur.
2. **Yakın cam öğeleri grupla.** Harita çipleri, sohbet "+" ve gönder gibi yakın öğeler `GlassContainer` içinde olsun; yaklaşınca birbirine akarlar.
3. **Opaklıkla oynama.** Camın opaklığı 1'in altına indirilmez; görünüp kaybolma için `glassEffectStyle` animasyonu kullanılır (Expo dokümanı).
4. **Erişilebilirlik:** "Saydamlığı Azalt" açıksa cam yerine düz yüzey kullan (`AccessibilityInfo.isReduceTransparencyEnabled()`). Cam API'si yoksa (`isGlassEffectAPIAvailable()`) normal `View`'e düş.
5. **Cam üstünde küçük fuşya metin yok.** Cam üstündeki metin sistem metin renginde olur; fuşya yalnızca dolgu, ikon veya nokta olarak. Kartlar da cam olduğu için (T-13) bu, kartlardaki canlı sayılar ("● 342 burada": fuşya nokta, nötr metin) ve okunmamış mesaj saati için de geçerli; koyu modda gri camda fuşya metin 3.4–4.45:1'e düşüyordu (§3.3). Tek istisna sekme çubuğunun seçili rengi (T-2): bu rengi sistem çiziyor ve camda okunurluğu kendisi ayarlıyor.
6. **İki uçta da test et:** iOS 27'deki şeffaf ↔ renkli kaydırıcının iki ucunda, açık ve koyu modda, açık renkli bir fotoğrafın ve siyah bir zeminin üstünde.
7. **Küçük yüzen kontrolde net cam, kartta regular cam.** Net (`clear`) cam arkasındaki haritayı ve gradyanı daha çok gösterir (T-14); uzun metin taşıyan kartlar ve sayfalar okunurluk için `regular` kalır.

---

## 3. Renk sistemi

### 3.1 Marka renkleri

| Renk | Değer | Rol |
|---|---|---|
| **Wild Fuchsia** | `#E11D49` | Birincil eylem, canlı durum, okunmamış, kendi mesaj balonun |
| **Winter Haze** | `#D9DEE5` | Açık modda çipler, giriş alanları, ikincil buton (artık sayfa zemini değil, T-11) |
| Beyaz | `#FFFFFF` | Açık mod zemininin tabanı; üstünde marka gradyanı (§3.6) |
| Siyah | `#000000` | Koyu mod zemininin tabanı; üstünde marka gradyanı (§3.6) |

### 3.2 Belirteçler (`src/constants/theme.ts`)

| Belirteç | Açık | Koyu | Kullanım |
|---|---|---|---|
| `background` | `#FFFFFF` | `#000000` | Zeminin tabanı; ekranlar üstüne `Backdrop` gradyanını çizer |
| `surface` | `#FFFFFF` | `#121214` | Cam kullanılamadığında kart ("Saydamlığı Azalt", cam API'si yok) |
| `fill` | `rgba(120,120,128,.12)` | `rgba(120,120,128,.24)` | Kart içi satır, ayar satırı, avatar ekleme dairesi: gradyanın rengini alan yarı saydam dolgu |
| `backgroundElement` | `#D9DEE5` (Winter Haze) | `#1F2024` | Çip, giriş alanı, segment rayı, ikincil buton |
| `segmentActive` | `#FFFFFF` | `#3A3B41` | Seçili segment |
| `text` / `textSecondary` | `#0B0C10` / `#474D59` | `#FFFFFF` / `#9EA3AD` | Metin (açık ikincil, güçlü gradyan için `#555C69`'dan koyulaştırıldı, T-18) |
| `accent` | `#E11D49` | `#E11D49` | Fuşya **dolgu** |
| `onAccent` | `#FFFFFF` | `#FFFFFF` | Dolgu üstündeki metin |
| `accentInk` | `#C4123F` | `#FF4F79` | Fuşya **metin/ikon** (küçük yazıda erişilebilir ton) |
| `accentSoft` | `#FCE4EA` | `#3D0F1C` | Fuşya tonlu zemin (sayaç, rozet) |

### 3.3 Kontrast (WCAG; küçük metin için 4.5:1 gerekir)

| Kombinasyon | Oran | Sonuç |
|---|---|---|
| Fuşya `#E11D49` metin · Winter Haze | 3.47:1 | 🟡 yalnız büyük metin/ikon |
| Fuşya `#E11D49` metin · beyaz | 4.69:1 | ✅ |
| Fuşya `#E11D49` metin · siyah | 4.47:1 | 🟡 yalnız büyük metin/ikon |
| Beyaz metin · fuşya dolgu | 4.69:1 | ✅ |
| `accentInk` açık `#C4123F` · beyaz / sayfa / accentSoft | 5.99 / 5.29 / 4.97 | ✅ |
| `accentInk` koyu `#FF4F79` · siyah / kart / accentSoft | 6.65 / 5.92 / 5.18 | ✅ |
| İkincil metin açık `#474D59` · Winter Haze / beyaz | 5.9 / 8.5 | ✅ (iOS sistem grisi `#8E8E93` Winter Haze üstünde ≈2.4:1, kullanılmaz) |
| İkincil metin koyu `#9EA3AD` · kart | 7.39:1 | ✅ |
| Metin · gradyanın en yoğun noktası (açık / koyu) | 13.6 / 13.9 | ✅ |
| İkincil metin açık · güçlü gradyanın metin bandı (y 90–330 pt), A / B / C | 4.63 / 4.63 / 4.93 | ✅ (T-18 denemeleri; B'nin sağ alt köşesinde 4.2, orada metin kartların üstünde) |
| İkincil metin koyu · gradyanın en yoğun noktası, A / B / C | 4.91 / 4.28 / 4.65 | 🟡 B'nin sağ alt köşesi; seçilen zemine göre son ayar yapılacak |
| `accentInk` · gradyanın en yoğun noktası (açık / koyu) | 4.17 / 4.38 | 🟡 En yoğun nokta sol üst köşe, durum çubuğunun altı; orada küçük fuşya metin yok |
| `accentInk` · cam kart, açık mod (ekrandan ölçüldü) | 5.2–6.0 | ✅ |
| `accentInk` · cam kart / kart içi satır, koyu mod (ekrandan ölçüldü) | 4.45 / 3.42 | ❌ Küçük metinde kullanılmaz: canlı sayı ve okunmamış saat nötr metin + fuşya nokta (§2.3 kural 5) |

### 3.4 Fuşya kuralları

- **Kullan:** ekran başına tek birincil eylem; canlı durumlar; okunmamış rozetleri; kendi mesaj balonun; seçili/onay işaretleri; sayacın son 60 dakikası.
- **Kullanma:** linkler, ikincil butonlar, Takip et / Mesaj, ayar anahtarları, kilit ikonu, gövde metni.
- **Yıkıcı eylemler** (Engelle, Sil, Takibi bırak) iOS'un kırmızı "destructive" stilinde ve açık metinle gösterilir; fuşya ile kırmızı birbirine yakın olduğu için ikisi asla aynı ekranda yan yana birincil eylem olmaz.
- **Kötü örnek:** [Flo](https://mobbin.com/screens/06c42694-7011-4914-a3a8-6cff5ab077d1)'da çip, link, "See all" ve "Follow" hepsi pembe; hiçbiri öne çıkmıyor. **İyi örnekler:** [Airbnb](https://mobbin.com/screens/06f2e9bb-ea0e-4fee-9a95-bd3f73e11d32) (pembe yalnızca "Reserve" ve kaydedilmiş kalp), [Tinder sohbetler](https://mobbin.com/screens/0e57bf54-18cc-4ff4-8bc4-66edd081e15a) (pembe yalnızca okunmamış noktası).

### 3.5 Koyu mod

Saf siyah taban; üst bölümde fuşya, gece mavisi ve mürdüm ışıklardan oluşan marka gradyanı (§3.6), ekranın alt yarısı saf siyah kalır (OLED'de pil dostu). Katmanlar gölgeyle değil cam ve yüzey açıklığıyla ayrılır (`#121214` opak kart yedeği, `#1F2024` kontrol). Fotoğraf üstündeki metinlerde [BeReal](https://mobbin.com/screens/72d3854d-97be-4541-a917-64a0100ce65d) gibi alttan siyah geçiş.

### 3.6 Zemin gradyanı (Backdrop)

Her ekranın zemini, [Klarna](https://mobbin.com/screens/f102e3e3-a610-4931-9a8b-d8b787c26995)'nın ana sayfasındaki gibi yumuşak bir marka gradyanıdır (T-11). Kurucu açık modda renklerin az belli olduğunu söyledi; renkler güçlendirildi ve üç düzen denemeye açıldı (**T-18, karar bekliyor**). Ayarlar › Tasarım denemesi › Zemin'den değiştirilir; seçim cihazda saklanır.

| Deneme | Açık mod (beyaz taban) | Koyu mod (siyah taban) |
|---|---|---|
| **A · Üst ışıklar** | Sol üstte fuşya `#E11D49` %34, sağ üstte mavi-lavanta `#6E82DC` %42, ortanın üstünde pembe `#FF8CB4` %40; altı beyaz | Fuşya %46, gece mavisi `#5F69BE` %36, mürdüm `#96144B` %30; altı siyah |
| **B · Üst + sağ alt** | A + sağ altta mavi-lavanta %55 ve fuşya %26 (kartların arkası da renk alır) | A + sağ altta mavi `#465AD2` %55 ve fuşya %30 |
| **C · Geniş** ([Revolut](https://mobbin.com/screens/df7b1aab-511c-4959-9238-7ec8da733902) gibi) | Tüm ekran pembe → lavanta → beyaz yıkama + sol üst fuşya, sağ orta mavi ışık | Mürdüm `#1A0E2C` → lacivert `#0A1238` → siyah yıkama + fuşya ve mavi ışık; kartlar laciverte bürünür |

- **Kod:** `Backdrops` (`src/constants/theme.ts`), React Native 0.88'in `experimental_backgroundImage` radyal ve doğrusal gradyanlarıyla; görsel dosyası yok, her ekran boyutuna uyar. Ekranlar `useBackdrop()` ile seçili denemeyi alır.
- **Her ekranda:** yığınların `contentStyle`'ında verilir; her ekran kendi zeminini taşır, geçişlerde zeminler üst üste binmez. Sayfa (sheet) zeminleri şeffaf kalır, iOS camı görünür.
- **Neden:** Cam ancak arkasında renk varken görünür; düz beyaz ya da siyah zeminde cam kartlar kaybolur. Paylaşım kartlarının geçirgenliği (T-17) en çok B ve C'de fark edilir.
- **Karar verilince:** seçilmeyen iki düzen ve deneme menüsü kaldırılır, kontrast seçilen düzene göre son kez ayarlanır.
- **Karşılaştırma:** üç düzen açık/koyu, üstte ve kaydırınca: [ekranlar/secenekler.jpg](ekranlar/secenekler.jpg).

### 3.7 Görünüm (açık / koyu)

Ayarlar › Görünüm: **Sistem** (varsayılan) · Açık · Koyu (T-15). Seçim cihazda saklanır ve tüm yerel arayüze uygulanır: sekme çubuğu, cam, harita, SwiftUI ayarları. Telefon açık moddayken "Koyu" seçilmişse açılışta beyaz flaş olmasın diye açılış ekranı seçim uygulanana kadar kalır ve 250 ms'de solarak kalkar.

Görünüm alanının tasarımı için üç seçenek (**T-19, karar bekliyor**; Ayarlar › Tasarım denemesi › Görünüm alanı):

| Seçenek | Nasıl | Artısı / eksisi |
|---|---|---|
| **1 · Önizlemeli kartlar** | Sistem / Açık / Koyu için gerçek zemin gradyanını ve cam kartları gösteren mini ekranlar, altında onay dairesi; "Sistem" yarı açık yarı koyu | Markayı ve gradyanı gösterir, seçim hemen anlaşılır · en çok yeri kaplar |
| **2 · iOS gibi (Otomatik)** | Açık / Koyu önizlemeleri + "Otomatik" anahtarı (iOS Ayarlar › Ekran ve Parlaklık) | iOS kullanıcısına tanıdık · "Otomatik" ile önizleme arasındaki ilişki bir adım daha düşündürür |
| **3 · Menü satırı** | Tek satır "Görünüm · Sistem ⌃⌄", dokununca açılan menü | En sade, en az yer · görsel değil; nadiren değişen bir ayar için yeterli |

Üç seçeneğin ekran görüntüleri: [ekranlar/secenekler.jpg](ekranlar/secenekler.jpg) (en alttaki satır).



---

## 4. Tipografi, ikonlar ve şekiller

**Yazı tipi:** **DM Sans**, her yerde (T-16); boyutlar aşağıdaki iOS ölçeğinde ve kullanıcının yazı boyutu ayarıyla büyür.

- **React Native metinleri:** `@/components/text` (`Text`, `TextInput`): `fontWeight`'e göre doğru DM Sans dosyasını seçer (400 Regular · 500 Medium · 600 SemiBold · 700 Bold · 800 ExtraBold). İç içe metin, kendi ağırlığı yoksa üstteki metnin yazısını alır.
- **Yerel parçalar:** başlık çubukları ve büyük başlıklar (`HeaderFonts`, `TitleFonts`), sekme etiketleri (`labelStyle`), araç çubuğu düğmeleri, SwiftUI düğmeleri ve ayar satırları (`font({ family, textStyle })`), segment denetimi (UISegmentedControl).
- **İstisnalar (sistem çizer, değiştirilemiyor):** uyarılar, eylem sayfaları ve açılır menüler; harita etiketleri; geniş ekranda (iPhone Duo) kenar çubuğundaki sekme adları.
- **Yükleme:** `@expo-google-fonts/dm-sans` ile açılışta; açılış ekranı yazılar yüklenene kadar kalır. Expo Go'da da çalışır.

| Stil | Boyut | Kullanım |
|---|---|---|
| Large Title | 34 bold | Sekme başlıkları (Keşfet, Mesajlar) |
| Title2 | 22 bold | Profildeki ad, mekân adı |
| Headline | 17 semibold | Bölüm başlıkları, sohbet başlığı |
| Body | 17 | Paylaşım metni, mesajlar, biyografi |
| Subheadline | 15 | @kullanıcı adı, sayılar (rakam semibold) |
| Footnote | 13 | Açıklamalar, zaman bilgisi |
| Caption1 | 12 | Çipler, rozetler |

- **Sayaç:** sabit genişlikli rakamlar (`tabular-nums`), dakikada bir güncellenir.
- **Logo:** vektör HERE (`src/components/wordmark.tsx`); yalnızca ana sayfada, metin renginde (fuşya değil). Diğer sekmelerde iOS büyük başlık.
- **İkonlar:** SF Symbols. Pasifken çizgi, aktifken dolu; renk metin rengi, fuşya yalnızca canlı durumlarda. Geri sayım ikonu `hourglass`.
- **Köşeler:** butonlar ve çipler kapsül · cam kartlar 22, paylaşım kartı 26 · fotoğraf küçük resimleri 12 · avatarlar daire · ayar listeleri iOS "insetGrouped".
- **Avatarlar:** akış 36 pt · sohbet 28–32 pt · "şu an" şeridi 64 pt halkalı · profil 80 pt.
- **Dokunma alanı:** en az 44×44 pt.

---

## 5. Ekran ekran öneriler

Her başlıkta önce **karar önerisi**, sonra en iyi referanslar.

### 5.1 Kayıt (onboarding)

**Akış (karşılamadan sonra 7 ekran, 5'i zorunlu, hedef ≈ 60 sn):** Telefon → SMS kodu → Doğum tarihi → Ad + @kullanıcı adı → Fotoğraf *(atlanabilir)* → İlgi alanları → Konum izni *(atlanabilir)*.

- **Karşılama:** Açık modda da koyu kalsın: gece fotoğrafı veya döngüsel video, başlık "Şimdi, burada.", alt satır "Mekânda yer bildir, oradakilerle plan kur." ve kum saatli küçük kapsül "Her şey 04:00'te sıfırlanır". Önce fuşya "Telefonla devam et", "veya" ayracı, sonra eşit boyda Apple (resmi stil) ve Google. En altta Koşullar, KVKK ve "HERE 18+ içindir". Ayrı bir "Giriş yap" yok; kayıtlı numara için "Tekrar hoş geldin, Elif". Apple veya Google ile gelenler de telefon doğrulamasından geçer (K-09); ad alanı oradan dolu gelir.
- **Telefon:** +90 varsayılan, "5XX XXX XX XX" maskesi, odak açılışta. CTA "Kod gönder" 10 hane olana kadar pasif. "Numaran profilinde görünmez."
- **SMS kodu:** Tek alan, 6 kutu görünümü; iOS'un otomatik kod doldurması (`oneTimeCode`), 6. hanede kendiliğinden doğrulama. "+90 532 *** ** 17 · Düzenle". 30 sn sonra "Tekrar gönder"; 2 hatadan sonra "WhatsApp ile gönder". Hatada kırmızı kutular + titreşim.
- **Doğum tarihi:** GG/AA/YYYY sayısal alanlar, altında canlı "24 yaşındasın"; kilitli "Profilinde görünmez". Onay: "Sonradan değiştirilemez." 18 altı: tam ekran ret, numara ve cihaz işaretlenir.
- **Ad + @kullanıcı adı (tek ekran):** Üstte canlı profil önizlemesi (büyük ad + küçük @). @ addan önerilir (ç→c, ğ→g…), 400 ms sonra uygunluk kontrolü, "✓ Uygun / ✗ Alınmış" + 3 öneri çipi.
- **Fotoğraf:** 120 pt daire + fuşya "+" rozeti; Kamera / Galeri; "Şimdilik atla". "Anonim paylaşımlarında görünmez."
- **İlgi alanları:** "Nelerden hoşlanırsın?" · gruplar: Gece hayatı · Sahne · Yeme-içme · Semtler. Seçili çip fuşya dolgu + ✓; CTA'da sayaç ("2 tane daha seç" → "Devam (3)").
- **Konum izni:** Mini İstanbul haritası + 3 madde ("300 m içinde yer bildir · Yalnızca uygulama açıkken · Konumun paylaşılmaz"). Kesin Konum kapalıysa uyarı kartı.
- **İlerleme:** Geri oku + 6 bölümlü ince çubuk aynı satırda; CTA klavyenin üstünde, etiketi eylem fiili.
- **Bitiş:** Boş akış yerine "Merhaba Elif, bu gece neredesin? → Buradayım".

**Referanslar:** [X · Welcome](https://mobbin.com/screens/8b032d29-7249-4a31-9adf-cd8ca5182125) · [BeReal · Onboarding](https://mobbin.com/flows/15bad8e1-bddd-4882-84ea-05be1ca53199) · [Hinge · Onboarding](https://mobbin.com/flows/abe2f348-e006-4061-a5b0-8c1d8d7989b7) · [Vestiaire · Kod](https://mobbin.com/screens/6c41f984-6c26-4a6b-b21c-99375ca6604c) · [Sesame · 18+](https://mobbin.com/screens/966a5aaf-ae37-420d-9465-7439ec78927d) · [BeReal · Kullanıcı adı](https://mobbin.com/screens/adab1ae9-000f-4281-917c-24351a75f8a4) · [X · Profil fotoğrafı](https://mobbin.com/screens/fb0041bf-5e40-4bdc-8c67-54e2ac61c588) · [Locals · İlgi alanları](https://mobbin.com/screens/97354356-6811-4be8-8061-37e4b0ea2861) · [foodpanda · Konum izni](https://mobbin.com/screens/947f205f-8cf2-4867-8f18-f21066d7947b)

### 5.2 Ana sayfa (akış)

**Yukarıdan aşağıya (T-20, 17.10.2026):** üst bar → **Takipleştiklerin şu an** → **Şu an canlı** (büyük fotoğraflı mekân kartları, "Haritada ›") → **Bu gece** (saatli etkinlik listesi) → **Paylaşımlar** (Sana özel / Çevrende) → akış sonu. HERE logosu ortada; tanıdıkların şeridi başlıksız, konum etiketi yok. Ana sayfa "Bu gece nereye gitsem, kim nerede?" sorusunu cevaplar; paylaşımlar destekleyici içerik ([Uber Eats](https://mobbin.com/screens/f491a829-d30e-4561-abd7-0339cc7a44ef) gibi: önce ne var, sonra ayrıntı).

- **Hiyerarşi:** bölüm başlıkları iri ve kalın (`Type.section`, 22 bold), bölümler arası tek boşluk (`Gap.section` 32), köşeler tek set (`Radius`: kart 20, fotoğraf 14, denetim 12). Diğer ekranların bölüm başlıkları da aynı ölçüde.
- **Mekân kartı:** çerçevesiz; 16:11 fotoğraf, üstünde "● 342 kişi" etiketi, altında kalın ad, tek satır "Kategori · semt · mesafe", varsa "Zeynep orada". Tanıdık olan mekânlar önde.
- **Fotoğraflar:** prototipte kategoriye uygun Unsplash fotoğrafları (konser, ocakbaşı, meyhane, kahve, sahil, çatı barı, burger); yorumlar mekânla ve yemekle ilgili.
- Önceki düzen (aşağıdaki maddeler) bu sırayla birleşti: "Çevrende" şeridi yerine her zaman "Şu an canlı".

- **Üst bar:** HERE logosu (metin renginde). Sayaç yok: paylaşımlar kalıcı, 04:00'te yalnızca sohbetler sıfırlanır (K-16). Sabit başlık çubuğu yok: logo ve sekmeler içerikle birlikte yukarı kayıp kaybolur; geriye yalnızca Dynamic Island ve durum çubuğunun altında, aşağı doğru yumuşakça kaybolan bir bulanıklık kalır ([Instagram, Ekim 2026](https://mobbin.com/screens/f5ce72ad-1ae5-47d3-abde-989324593482), T-12). DM ve "+" ikonu yok; ikisinin de kendi sekmesi var.
- **Sekmeler:** "Sana özel | Çevrende" (T-4, T-9).
- **Şerit:**
  - *Sana özel:* "Takipleştiklerin şu an": 64 pt halkalı avatar + altında mekân adı; aynı mekândakiler tek baloncukta ("Rıhtım · 3"). İlk öğe senin fotoğrafın: yer bildirmediysen fuşya "+" rozeti ("Yer bildir"), bildirdiysen fuşya halka (Instagram'daki "Hikâyen" gibi).
  - *Çevrende:* canlı mekân kartları ("● 48").
- **Kart:** cam kart (Liquid Glass, T-13): (1) 36 pt avatar, ad, "· 12 dk", ••• · (2) dokunulabilir 📍 mekân satırı + "● 48 burada" · (3) 4:5 fotoğraf, çift dokunuşla beğeni · (4) beğen · yorum · gönder; sağda duruma göre "Sohbete katıl" (aynı mekândaysan) veya "Mekâna git". Anonim gönderide nötr siluet, mekân yine görünür.
- **Paylaştıktan sonra:** akışın üstünde satır içi "Paylaşılıyor…" çubuğu.
- **Akış sonu:** "Şimdilik bu kadar."

**Referanslar:** [Instagram · Akış başlığı](https://mobbin.com/screens/f95624c3-820d-4009-bb0b-59a53f3ba585) · [Instagram · Kaydırınca başlık kaybolur](https://mobbin.com/screens/f5ce72ad-1ae5-47d3-abde-989324593482) · [X · For you / Following](https://mobbin.com/screens/db2de9cd-1339-4e10-81a2-8bf08f152258) · [AllTrails · Local / Following](https://mobbin.com/screens/025f04a7-5fcc-41e7-8d0e-33213e933880) · [Swarm · Check-in kartı](https://mobbin.com/screens/a7f7b6d6-5730-4393-8a58-52fce646e4fe) · [Lex · "Chat" butonlu kart](https://mobbin.com/screens/b2dba757-668f-4600-8416-b86ce16ff0aa) · [Instagram · Posting… çubuğu](https://mobbin.com/screens/8f666642-7843-4c66-920b-f9660add856d) · [Pangea · Who's Around](https://mobbin.com/screens/f3779e10-154d-41a7-b0cc-ab36fcebaa4e)

### 5.3 Yer bildirimi ve paylaşım

- **Buradayım ekranı:** üst %35 harita (300 m dairesi + kullanıcı noktası), altında yükseltilebilir sayfa: "Mekân ara" (Google atfı alanın içinde), satırlar "ikon · ad · 120 m · Bar · ● 23", mesafeye göre sıralı. 300 m dışındakiler gizlenmez, soluk: "Mekânda olmalısın".
- **Onay sayfası:** büyük mekân adı + "Değiştir" bağlantısı + tam genişlikte cam-fuşya **Buradayım**. Sonra tek öneri: "Grup sohbetine katıl (23)". Fotoğraf isteğe bağlı.
- **Paylaşım (tek ekranlık sayfa, sihirbaz değil):** değiştirilemeyen mekân etiketi → 4:5 fotoğraf (önce kamera) → açıklama (280 sayaç) → "Kim görebilir: Herkes ›" satırı (dokununca 3 seçenekli sayfa; her seçeneğin altında sonucu: *Herkes:* yakındakilerin akışında · *Takipçilerim* · *Anonim:* adın gizlenir, mekân görünür) → en fazla 2 açıklamalı anahtar → altta fuşya **Paylaş**.
- **Harita gezilebilir:** Buradayım haritası kaydırılıp yakınlaştırılabilir; sağ altta cam "Konumuma dön" düğmesi. Uzaktaki pine dokunmak yer bildirimini değil mekân sayfasını açar.
- **Yalnızca yakında (K-17):** mekâna 300 m'den uzaksan sayfa nedenini açıklar ("Bu mekâna 900 m uzaktasın…") ve düğme kapalı kalır ("Mekânda olmalısın"). Evden yer bildirip sohbete katılmak yok.

**Referanslar:** [Swarm · Logging a check-in](https://mobbin.com/flows/b085bdb2-fca9-47b6-bb94-e32e8a110c48) · [Swarm · Changing a location](https://mobbin.com/flows/25bbbb32-f68b-494b-8e2a-f87bba8bdf25) · [Bump · Yakındaki yer seçici](https://mobbin.com/screens/fa69f7d0-7cdc-4965-933d-0b90d310d993) · [Live Nation · At the Venue?](https://mobbin.com/screens/cc8c52fe-fc15-4802-9539-54a0c562f4be) · [Instagram · New post](https://mobbin.com/screens/6d8a7cd3-a695-4fa4-a59a-a8c0d647cc8a) · [TikTok · Post](https://mobbin.com/screens/7b742cfa-b90e-467d-b73b-8fb9092857ce) · [BeReal · Select your Audience](https://mobbin.com/screens/6603693a-e64f-446b-990f-028e2a0a522b)

### 5.4 Mekân sayfası

- 16:10 kapak (gece fotoğrafı, alttan siyah geçiş) → ad (Title2), kategori, mesafe.
- **"● 48 kişi şu an burada"** satırı + üst üste avatarlar (takip edilenler önde); dokununca "Burada kimler var" sayfası. Anonimler sayıya dahil, listede yok.
- "Bu gece" 3 sütunlu fotoğraf ızgarası.
- Grup sohbeti önizlemesi ("23 kişi · son mesaj 2 dk"); yer bildirmemiş kullanıcıya bulanık iskelet balonlar + kilit.
- **Altta sabit, duruma göre değişen tek buton:** 300 m içindeyse **Buradayım** · yer bildirdiyse **Sohbete katıl** · uzaktaysa ikincil "Yol tarifi".

**Referanslar:** [corner · Mekân](https://mobbin.com/screens/1af2ee0f-6b30-4bbe-a1c2-f8ea2156d07d) · [Posh · Etkinlik + RSVP](https://mobbin.com/screens/1177d96b-90b8-441b-bfa2-c6717f9f3615) · [Beli · Mekân](https://mobbin.com/screens/a48ac100-625e-45dd-b33e-f4576ade1ca7) · [Places · Bar Part Time](https://mobbin.com/screens/006cff91-e623-4a70-83ea-65d2092f5ff0)

### 5.5 Keşfet (harita)

- Tam ekran gece temalı harita (K-05 gereği Google Maps). Üstte cam arama alanı + cam filtre çipleri (`GlassContainer`): *Şu an canlı · Bar · Konser · Restoran · Takip ettiklerim*.
- Pin: fuşya kapsül içinde "● 23", kalabalık arttıkça daha parlak. Takip edilenler pinin üstünde (en fazla 2 avatar + "+3"). Üst üste binen pinler sayılı kümelere dönüşür.
- **3 durumlu alt sayfa:** kapalı "Yakında 12 canlı mekân" · yarı açık liste · pine dokununca önizleme kartı ve ana buton.
- **Kişilerin kesin konumu asla gösterilmez** (yalnızca mekân düzeyi, karşılıklı takipleşenlere).

**Referanslar:** [Snapchat · Kategoriye göre yer arama](https://mobbin.com/flows/3143f64c-7471-4da3-8439-4165e0d59598) · [Snapchat · Map](https://mobbin.com/flows/0c909e9c-8dad-453a-b88c-a494bc6c34ac) · [Meetup · Harita](https://mobbin.com/screens/488a6aef-3f0b-4474-a065-95eb75f0bffe) · [Swarm · Explore](https://mobbin.com/screens/f4d0f9b9-f7dc-4a20-99e9-1628f86e5044)

### 5.6 Mesajlar (gelen kutusu ve istekler)

- Büyük başlık "Mesajlar", altında bir kez: "⏳ Tüm sohbetler 4 sa 12 dk sonra silinir". Satır başına sayaç yok.
- En üstte "Şu an buradasın" kartı: mekân fotoğrafı (yuvarlatılmış kare, kişilerden ayrışsın), "142 kişi", canlı nokta.
- Çipler: Tümü · Gruplar · Birebir. Başlıkta sağda **"İstekler (3)"** bağlantısı (listeyi kirletmez).
- Satır: 52 pt avatar, kalın ad, gruplarda "Ad: mesaj", sağda saat; okunmamışta fuşya sayaç ve kalın ad. Kaydırma: Sessize al / Sil.
- **İstek satırı:** avatar, ad, ilişki bağlamı ("Seni takip ediyor" / "Dün aynı mekândaydınız"), gri kutuda ilk mesaj, **Kabul et** / Sil; Engelle ••• menüsünde. Üstte: "Kabul etmediğin istekler 04:00'te silinir."
- **Gönderen tarafı:** composer pasif: "Kabul edilene kadar yeni mesaj gönderemezsin."

**Referanslar:** [WhatsApp · Chats + çipler](https://mobbin.com/screens/a9840503-a573-48d2-8d8f-21006b99bff5) · [Instagram · DM gelen kutusu](https://mobbin.com/screens/fafb59d5-9aa6-4c27-8ead-ddd7098eb85b) · [Meta Quest · İstek kararı](https://mobbin.com/screens/c004f1e9-c9f7-4a4a-bcfd-725599506d4b) · [X · İstekler](https://mobbin.com/screens/b9d47aae-5407-4bc1-b76f-56198d875dc0) · [Xbox · Message requests](https://mobbin.com/flows/e29b3107-0283-463e-9cf4-cc19d096cbb8)

### 5.7 Sohbetler (mekân sohbeti, DM, plan kartı)

- **Başlık:** ad (17 semibold), altında "142 kişi burada · ⏳ 6 sa 16 dk" (13, ikincil renk); son 60 dakikada alt satır fuşya kapsüle döner. Başlığa dokununca 04:00 kuralını anlatan sayfa. İlk girişte tek sistem mesajı: "Bu sohbet her gece 04:00'te sıfırlanır. Yalnızca burada yer bildirenler katılabilir."
- **Mekân sohbeti = kompakt satırlar** (balonsuz): 24–28 pt avatar, "Ad · saat" tek satırda, altında metin; kendi mesajın sağda fuşya balon. **DM ve küçük gruplar = balon.** Ardışık mesajlar gruplanır (ad bir kez üstte, avatar bir kez altta); saat yalnızca 15 dk'dan uzun aralıklarda ayırıcı.
- **Takma ad kimliği:** takma addan sabit renk + hayvan ikonu (Martı → martı), gece boyunca değişmez; dokununca profil değil Engelle/Bildir.
- **Plan kartı:** emoji + başlık; "00:30 · 2 no'lu kapı · 45 dk sonra"; avatar yığını + "12 kişi katılıyor"; tek buton **Ben de varım** → fuşya dolu "✓ Varsın" (geri alınabilir). Saati geçen kart soluklaşır. "+" → Plan; saat seçici en geç 04:00.
- **Sabit plan şeridi** başlığın altında; birden çoksa "3 aktif plan ›".
- **Kalabalık yönetimi:** "↓ 38 yeni mesaj" kapsülü, "@ 2" bahsetme atlaması, yukarı kaydırınca otomatik kaydırma durur; "Son 10 dk'da 24 kişi katıldı" tek satır; "Birkaç kişi yazıyor…"; okundu bilgisi yok (DM hariç); yoğunlukta yavaş mod.
- **Kilitli sohbet:** bulanık iskelet balonlar + canlı sinyaller ("142 kişi · son 10 dk'da 86 mesaj · 3 aktif plan"); composer yerine fuşya **Yer bildir ve katıl**; katılırken kimlik seçimi (Profilimle / Takma adla).
- **Composer:** solda cam "+" (Fotoğraf · Kamera · Plan · Buluşma noktası), kapsül alan, boşken kamera, yazınca fuşya gönder; mekân sohbetinde solda kimlik çipi. Yer tutucu "Mesaj".
- **Uzun basma:** 6 emoji + Yanıtla / Kopyala / Bildir / Engelle.

**Referanslar:** [Discord · #general](https://mobbin.com/screens/4238a9c4-5959-4c99-ba68-87a42cd9ede8) · [Ladder · NYC Meetup](https://mobbin.com/screens/67494e56-9d7d-44d8-831e-88aaa8b0bc22) · [Luma · Etkinlik sohbeti](https://mobbin.com/screens/a01372cf-4ca3-43fb-a68a-a737fc11032f) · [GroupMe · "I'm in" kartı](https://mobbin.com/screens/8e2755f5-85a3-49c3-b0d8-a2a71828b671) · [XChat · Başlıkta zamanlayıcı](https://mobbin.com/screens/66f22415-3dc0-44c4-b64c-446cf9ffa778) · [Instagram · Kaybolan mesaj modu](https://mobbin.com/screens/b817c022-0c12-4e39-b978-bb4d6ebb34a5) · [Slack · Join channel](https://mobbin.com/screens/3fbd8a9e-ceb0-454b-9be6-d330f6c04711) · [XChat · Composer](https://mobbin.com/screens/11a1b0f9-0bf4-4fdc-b5ba-30f4a8968b54) · [Telegram · Tepki akışı](https://mobbin.com/flows/65a949d7-6d85-4ba3-93eb-62bfcf0ddc17)

### 5.8 Profil

- **Kendi profilin:** 80 pt avatar → Title2 ad → @kullanıcı adı (gizli hesapta yanında kilit) → biyografi → satır içi sayılar ("128 takipçi · 87 takip") → nötr ilgi alanı çipleri → gri tonal "Profili düzenle" + "Paylaş". Sağ üstte cam paylaş ve çark.
- **Sekme yok.** Tek bir **"Paylaşımların"** bölümü: paylaşımlar kalıcı (K-16); yer bildirmişsen en üstte "Şu an buradasın" kartı, hiç paylaşım yoksa boş durum metni ve **Buradayım**.
- **Başkasının profili:** buton tek yerde durum değiştirir: **Takip et** (metin renginde dolu) → **İstek gönderildi** (gri, saat ikonlu; dokununca "İsteği geri çek") → **Takip ediliyor** (gri; "Takibi bırak" onay ister). **Mesaj** her zaman gri tonal. Sağ üstte •••: Engelle / Bildir / Sessize al.
- **Gizli hesap:** başlık ve sayılar görünür; içerik yerine kilit + "Bu hesap gizli. Bu geceki yer bildirimlerini görmek için takip et."

**Referanslar:** [X · Profil](https://mobbin.com/screens/04adbd4e-9a4b-4bf4-9027-0ee4b817b4f3) · [BeReal · Profil (koyu)](https://mobbin.com/screens/72d3854d-97be-4541-a917-64a0100ce65d) · [Instagram · Gizli hesap](https://mobbin.com/screens/9c930acd-4fd6-4400-b628-d1b44bbe66a9) · [Garmin · Takip akışı](https://mobbin.com/flows/e6f8a69c-9cc6-4e05-8f6e-ac426806da49) · [BeReal · Arkadaşlık isteği](https://mobbin.com/flows/eec0c11e-0489-4632-9cd0-52641503ca20)

### 5.9 Ayarlar

- iOS "insetGrouped" liste; zemin marka gradyanı, satırlar onun rengini alan yarı saydam dolgu.
- **Tasarım denemesi** grubu (geçici, en üstte): "Görünüm alanı" (1 · 2 · 3, T-19) ve "Zemin" (A · B · C, T-18) menüleri. Karar verilince kalkacak.
- **Görünüm** grubu: seçili tasarıma göre önizlemeli kartlar, iOS gibi Otomatik anahtarı ya da menü satırı (T-15, T-19, §3.7). "Her şey gece 04:00'te silinir" satırı kaldırıldı.
- Tüm satır, başlık ve dipnotlar DM Sans; satırlar gradyanın rengini alan yarı saydam dolgu.
- **Gizlilik** grubu:
  - "Gizli hesap" anahtarı + altında açıklama.
  - "Şu an burada kimler görsün" satırı, sağda mevcut değer ("Karşılıklı") + chevron → alt sayfa: Herkes / Karşılıklı / Kimse, her seçeneğin altında bir satır açıklama, seçilide onay işareti, en altta "Mekân listesinde böyle görüneceksin" önizlemesi.
  - Engellenenler · Sessize alınanlar.
- **Anahtarlar sistem renginde** (bkz. §6).

**Referanslar:** [Substack · Privacy & Safety](https://mobbin.com/screens/078f04d4-6411-46f3-9844-86ac832fa777) · [LinkedIn · Görünürlük önizlemesi](https://mobbin.com/screens/fe19636c-1c86-4b21-af5c-3cdc8c339dd0) · [WhatsApp · Mesaj zamanlayıcısı](https://mobbin.com/screens/4109ac74-59e5-44c2-9add-e44b12738c57)

### 5.10 Boş durumlar ve geçicilik

- **Kalıp:** bir başlık, bir cümle, bir buton ve yerine gösterilecek içerik. Çıkış yolu olmayan boş ekran yok.
- *Sana özel* boş: "Takip ettiklerin bu gece nerede?" + "Kişileri bul" + öneriler.
- *Çevrende* boş: "Etraf sessiz, ilk sen paylaş" + **Buradayım** + 2 km içindeki canlı mekânlar.
- 04:00'ten sonra sohbetlerde: **"Yeni gece, temiz sohbet."** Paylaşımlar yerinde kalır.
- Konum izni kapalı: ne işe yaradığını anlatan ekran + "İzni aç".
- **Sayaç:** tek genel sayaç; son 60 dakikada fuşya. İleride kilit ekranı ve Dynamic Island için Live Activity (BeReal gibi; ayrı yerel uzantı gerekir).

**Referanslar:** [BeReal · "It's really calm in here"](https://mobbin.com/screens/88524e8f-09ea-4490-b2f0-25c257d224d3) · [Posh · Following boş](https://mobbin.com/screens/81084b27-e0df-4532-ab24-282d2a5f4672) · [Saturn · No friends yet](https://mobbin.com/screens/997d4035-aa00-479d-808e-744e43d05466) · [BeReal · Logonun altında sayaç](https://mobbin.com/screens/2c7754b6-f872-45df-bca7-3f70797f9a80) · [BeReal · Live Activity](https://mobbin.com/screens/237d50a1-7845-4be2-a2d2-b4a7cdbe9245)

---

## 6. Raporlar arasındaki çelişkiler ve karar önerileri

Araştırmacıların farklı önerdiği ya da mevcut prototiple çelişen noktalar.

> **Karar (17.10.2026):** T-1…T-10 önerilerinin tamamı kabul edildi; aşağıdaki kalın seçenekler artık geçerli kuraldır.
> **İkinci tur (17.10.2026):** Kurucunun isteğiyle T-11…T-15 eklendi ve uygulandı. T-8'in yerini T-11 aldı.

| # | Konu | Seçenekler | Önerim | Neden |
|---|---|---|---|---|
| T-1 | **"Buradayım" sekmesi** | (a) iOS yerel sekme · (b) ortada yükseltilmiş fuşya buton (BeReal kamerası gibi) | **(a) + yer bildirmişken sekme üstü cam aksesuar** | iOS 27 uyumu: yerel sekme çubuğunun üstüne sahte buton koymak Liquid Glass'ı bozar. Aksesuar, "şu an buradasın"ı sistemin kendi alanında gösterir. |
| T-2 | **Seçili sekme rengi** | (a) fuşya · (b) metin rengi, fuşya yalnız rozetlerde | **(a) fuşya** | iOS'ta uygulamalar sekmelerini kendi rengine boyar; Apple Music bile pembe-kırmızı kullanıyor. Marka için güçlü ve yerel bir işaret. |
| T-3 | **Ayar anahtarı rengi** | (a) fuşya · (b) iOS sistem yeşili | **(b) sistem yeşili** | Fuşya kırmızıya yakın; açık bir anahtar uyarı gibi okunuyor. iOS Ayarlar ile tam uyum. |
| T-4 | **Akış sekmelerinin stili** | (a) yerel segment (cam) · (b) X tarzı yazı sekmeleri + fuşya alt çizgi | **(a) yerel segment** | iOS 27'de cam segment yerel ve kullanıcıların tanıdığı kalıp; X tarzı sekme özel bileşen gerektirir. |
| T-5 | **Logo konumu** | (a) solda · (b) ortada, sayaç altında (BeReal) | **(a) solda, sayaç sağda cam kapsülde** | Büyük harfli dört harflik logo solda büyük başlık gibi duruyor ([HYPE](https://mobbin.com/screens/d5f404ad-b66f-47fc-8332-f05ca2638b5c)); sayaç sağda cam öğe olarak yüzüyor. |
| T-6 | **Logo rengi** | (a) fuşya · (b) metin rengi | **(b) metin rengi** | Fuşyayı birincil eyleme saklamak için. |
| T-7 | **Takip et butonu** | (a) fuşya · (b) metin renginde dolu (siyah/beyaz) | **(b)** | Fuşya ekran başına tek birincil eylem; profilde o eylem değil. |
| T-8 | ~~**Açık mod sayfa zemini**~~ | (a) Winter Haze `#D9DEE5` · (b) açık ton `#EEF1F5` | ~~Akışta (b), ayarlar gibi gruplu listelerde (a)~~ → **T-11 ile değişti** | Düz zemin, cam kartlar gelince yerini gradyana bıraktı. |
| T-9 | **"Rastgele" sekmesinin adı** | "Rastgele" · "Çevrende" | **"Çevrende"** | İçerik rastgele değil, çevrendeki herkese açık paylaşımlar; "Sana özel" ile de eşleşiyor. "Yakında" elendi: Türkçede "yakında geliyor" gibi okunuyor. |
| T-10 | **Kartlarda kalan süre** | (a) her kartta ⏳ · (b) yalnız genel sayaç | **(b)** → K-16 ile sayaç yalnızca sohbetlerde | Paylaşımlar artık kalıcı; ana sayfa ve Keşfet'teki genel sayaç kaldırıldı. |
| T-11 | **Sayfa zemini** | (a) düz renk (T-8) · (b) marka gradyanı | **(b)** açıkta beyaz + fuşya/lavanta/pembe ışık, koyuda siyah + fuşya/gece mavisi/mürdüm; her ekranda (§3.6) | Kurucu isteği ([Klarna](https://mobbin.com/screens/f102e3e3-a610-4931-9a8b-d8b787c26995)). Cam ancak arkasında renk varken görünür. |
| T-12 | **Ana sayfa üst barı** | (a) sabit cam başlık · (b) içerikle kayar, yalnız durum çubuğu bulanık | **(b)** | Kurucu isteği ([Instagram, Ekim 2026](https://mobbin.com/screens/f5ce72ad-1ae5-47d3-abde-989324593482)). Akışa daha çok yer kalır; bulanıklık saatin altına giren içeriği bastırır. |
| T-13 | **Paylaşım kartları** | (a) opak · (b) Liquid Glass | **(b)** tüm kartlar `regular` cam; fotoğraflar ve mesaj balonları opak | Kurucu isteği. Apple camı gezinme katmanına ayırıyor; bilinçli sapma, okunurluk için `regular` cam ve hafif beyaz tint. |
| T-14 | **Cam yoğunluğu** | (a) `regular` · (b) `clear` | **Yüzen kontrollerde (b), kartlarda (a)** | Kurucu isteği: "daha net cam hissi". Net cam haritayı ve gradyanı daha çok gösterir. |
| T-15 | **Açık/koyu mod** | (a) yalnız sistem · (b) Ayarlar'da Sistem / Açık / Koyu | **(b), varsayılan Sistem** | Kurucu isteği. Gece kullanımında telefon açık moddayken bile koyu seçilebilir. |
| T-16 | **Yazı tipi** | (a) SF Pro · (b) DM Sans | **(b) her yerde** | Kurucu isteği. Geometrik, sıcak bir sans; Türkçe karakterleri tam. İstisnalar §4'te. |
| T-17 | **Paylaşım kartlarının geçirgenliği** | (a) buzlu cam + beyaz ton · (b) net cam, tonsuz | **(b)** | Kurucu isteği: "biraz geçirgen olsun". Arkadaki gradyan kartın içinden görünür. |
| T-18 | **Zemin düzeni** | A üst ışıklar · B üst + sağ alt · C geniş (Revolut gibi) | **Karar bekliyor** | Kurucu: "açık modda renkler az belli; sağ alt ya da Revolut gibi geniş alan olabilir, deneyip karar vereceğiz" (§3.6). |
| T-19 | **Ayarlar › Görünüm alanı** | 1 önizlemeli kartlar · 2 iOS gibi (Otomatik) · 3 menü satırı | **Karar bekliyor** | Kurucu: "başka bir şekilde yapalım, seçenekler sun" (§3.7). |
| T-20 | **Ana sayfa kurgusu ve hiyerarşi** | (a) paylaşım akışı · (b) mekân odaklı bölümler | **(b)** | Kurucu: "görüntü profesyonel durmuyor". Uber Eats gibi: iri bölüm başlıkları, büyük fotoğraf, tek satır bilgi; paylaşım kartında katman azaldı (mekân kapsülü ve buton yerine bağlantı satırları). |

---

## 7. Uygulama sırası

Her adım iOS 27 simülatörlerinde (iPhone 18 Pro · iOS 27.0 ve iPhone Duo · iOS 27.1) açık ve koyu modda test edildi.

| # | Adım | Durum (17.10.2026) |
|---|---|---|
| 1 | **Temel:** cam bileşenleri, SwiftUI butonları, yerel segment, belirteçler | ✅ |
| 2 | **Gezinme iskeleti:** her sekmede yerel başlık, büyük başlık, küçülen sekme çubuğu, cam aksesuar | ✅ |
| 3 | Ana sayfa (§5.2) | ✅ |
| 4 | Yer bildirimi + paylaşım sayfası (§5.3) | ✅ |
| 5 | Mekân sayfası (§5.4) + "Burada kimler var" cam sayfası | ✅ |
| 6 | Keşfet haritası (§5.5) | ✅ Pin kümelenmesi yok |
| 7 | Mesajlar + sohbet + plan kartı (§5.6–5.7) | ✅ Kaydırarak sessize alma/silme yok |
| 8 | Profil + ayarlar (§5.8–5.9) | ✅ |
| 9 | Kayıt akışı (§5.1, yeni ekranlar) | ⬜ Sırada |
| 10 | Boş durumlar (§5.10) | 🟡 Kısmen: profil, istekler, mesajlar |
| 11 | Gradyan zemin, kayan üst bar, cam kartlar, net cam, görünüm ayarı (T-11…T-15) | ✅ |
| 12 | DM Sans (T-16), sahte profil fotoğrafları, geçirgen paylaşım kartları (T-17), 04:00 yazıları (K-16), yakın mekân kuralı (K-17) | ✅ |
| 13 | Zemin (T-18) ve görünüm alanı (T-19) denemeleri | 🟡 Uygulandı, karar bekliyor |

Ekran görüntüleri: [ekranlar/ozet.jpg](ekranlar/ozet.jpg) (T-11…T-15 durumu; T-18 ve T-19 kararından sonra yenilenecek) · karar bekleyen seçenekler: [ekranlar/secenekler.jpg](ekranlar/secenekler.jpg).

### 7.1 Kullanılan yerel parçalar

| Parça | Nerede | Nasıl (Expo SDK 58) |
|---|---|---|
| Liquid Glass sekme çubuğu, küçülme | Tüm sekmeler | `NativeTabs`, `minimizeBehavior="onScrollDown"` |
| **Öne çıkan sekme (iOS 27)** | Buradayım | `unstable_nativeProps.ios.prominentScreenKey` → `UITabBarController.prominentTabIdentifier`. Sekme kendi cam dairesinde sağda durur ve çubuk küçülünce de görünür kalır. iOS 26'da ortada normal sekmedir. **T-1 notu:** ortada durmasını istersen tek satırla normal sekmeye dönülür. |
| Sekme aksesuarı | Yer bildirmişken | `NativeTabs.BottomAccessory`: "♪ mekân · kişi · kalan süre" |
| Kenar çubuğu (geniş ekran) | iPhone Duo iç ekranı, iPad | `sidebarAdaptable` + `tabBarSidebarPreferredPlacement: 'sidebar'` |
| Cam başlık düğmeleri ve menü | Tüm başlıklar | `Stack.Toolbar` (Button, Menu, View); iOS 26+ ortak cam arka plan |
| Büyük başlık, arama çubuğu | Buradayım, Mesajlar | `Stack.Title large`, `Stack.SearchBar` |
| Marka gradyanı | Tüm ekranlar | `Backdrop`: RN 0.88 `experimental_backgroundImage` (radyal gradyan), yığınların `contentStyle`'ında |
| Kademeli durum çubuğu bulanıklığı | Ana sayfa | `StatusBarBlur`: `expo-blur`, `@react-native-masked-view/masked-view` ve `expo-linear-gradient` maskesi; üstte güçlü, aşağı doğru kaybolur |
| SwiftUI butonları | Eylem düğmeleri | `@expo/ui`: yüzen düğmede `glassProminent`, içerikte `borderedProminent` / `bordered` |
| Yerel segment denetimi | Akış, mesajlar | `@react-native-segmented-control/segmented-control` (UISegmentedControl, iOS 26+ cam): SwiftUI segmentli seçici özel yazı tipi almadığı için; DM Sans |
| Yerel menü, form | Paylaşım, ayarlar | SwiftUI `Picker` (menu / inline), `Form`, `Toggle` (sistem yeşili); DM Sans `font({ family })` ile |
| SwiftUI içinde RN görünümü | Ayarlar › Görünüm önizlemeleri | `RNHostView` + `Group` (satır zemini) |
| Cam yüzeyler | Harita kontrolleri, sayaç, sohbet yazma alanı (`clear`) · kartlar (`regular`) | `expo-glass-effect` (`Glass`, `GlassCard`, `GlassGroup`); "Saydamlığı Azalt" açıksa opak |
| Görünüm ayarı | Ayarlar | `Appearance.setColorScheme` + `AsyncStorage`; `expo-splash-screen` seçim uygulanana kadar açık kalır, 250 ms solarak kalkar |
| Cam sayfa | Burada kimler var | `presentation: 'formSheet'`, yarım ve tam yükseklik |

### 7.2 iOS 27 bulguları

- **iPhone Duo (iOS 27.1):** İç ekran geniş (≈951×669 pt). iOS 27 bu ekranda sekme çubuğunu sağda dikey kapsül ya da kenar çubuğu olarak çiziyor. İç içe gezinme yığınlarıyla dikey kapsül kayboluyordu; kenar çubuğu moduna geçince düzeldi. React Native içeriği yatay güvenli alanı kendiliğinden almadığı için sayfalar `PageColumn` ile sarılıyor.
- **Ters (inverted) liste:** iOS 26+ kaydırma kenarı efektini bozup tüm mesaj listesini bulanıklaştırıyordu. Sohbet, normal liste ve sona kaydırma ile çözüldü.
- **Yüzde genişlikli görseller** (`expo-image`, Fabric) ızgarada çizilmedi; hücre boyutu artık ölçülen genişlikten hesaplanıyor.
- **Expo Go** (iOS 26.3) yeni kodu çalıştırıyor. Özel HERE simgesi ve iOS 27 SDK'sı için geliştirme derlemesi gerekiyor (README).
- **Açılış flaşı:** Telefon açık moddayken "Koyu" seçiliyse ilk açılışta ≈0,65 sn beyaz ve açık renkli ekran görünüyordu (açılış video kaydıyla ölçüldü). Açılış ekranı artık seçim uygulanana kadar kalıyor ve solarak kalkıyor; iki ölçümde de parlak kare kalmadı. Expo Go solma ayarını desteklemiyor, orada açılış ekranı birden kalkar.
- **SwiftUI Form beyaz zeminde** satırları kaybediyordu; `scrollContentBackground('hidden')` + `listRowBackground(fill)` ile satırlar gradyanın rengini alıyor.
- **Yeni yerel modüller** (expo-blur, masked-view, AsyncStorage, linear-gradient) geliştirme derlemesinin yeniden alınmasını gerektiriyor; eski derleme açılışta "AsyncStorage is null" hatası veriyor.
- **Özel yazı tipi ve yerel parçalar:** SwiftUI segmentli `Picker` `font` değiştiricisini yok sayıyor → UISegmentedControl paketine geçildi (yeni yerel modül, derleme yeniden alındı). `Stack.Title` kendi stilini yazdığı için yığının başlık yazısını ezer; her `Stack.Title`'a `TitleFonts` verilir. Duo'nun kenar çubuğundaki sekme adları için API yok.
- **Açık modda net cam beyazlatıyor:** beyaz zemin üstündeki net cam kart da beyaz görünüyor; geçirgenlik ancak arkada renk varken (B, C ya da gradyanın üstü) fark ediliyor.
- **Henüz test edilmedi:** "Saydamlığı Azalt", iOS 27 cam kaydırıcısının iki ucu, büyük Dynamic Type boyutları ve Android.

---

## 8. Kaynaklar

**iOS 27 / Liquid Glass**
- [Tom's Guide · iOS 27'de Liquid Glass ne kadar değişti?](https://www.tomsguide.com/phones/iphones/ios-27-has-a-bunch-of-changes-including-a-refined-liquid-glass-design-but-how-much-has-changed-from-ios-26)
- [BGR · iOS 27 Liquid Glass düzeltmesi ve özelleştirme](https://www.bgr.com/2191219/ios-27-liquid-glass-fix-customization/)
- [TechTimes · WWDC 2026: geliştiricilerin uyması gereken değişiklikler](https://www.techtimes.com/articles/317975/20260608/apple-liquid-glass-ios-27-wwdc-2026-brings-refinements-developers-must-adopt-today.htm)
- [Design for Native · Tasarımcıların iOS 27 hakkında bilmesi gerekenler](https://designfornative.com/what-designers-need-to-know-about-ios-27/)
- [Wikipedia · Liquid Glass](https://en.wikipedia.org/wiki/Liquid_Glass)

**Expo SDK 58**
- [expo-glass-effect](https://docs.expo.dev/versions/v58.0.0/sdk/glass-effect/) · [Native tabs](https://docs.expo.dev/router/advanced/native-tabs/) · [@expo/ui SwiftUI](https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/) · [Button](https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/button/) · [Picker](https://docs.expo.dev/versions/v58.0.0/sdk/ui/swift-ui/picker/)

**Mobbin:** referans linkleri ilgili bölümlerde. Mobbin bağlantıları için Mobbin hesabı gerekebilir.
