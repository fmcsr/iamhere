# HERE — Rota ve Beyin Fırtınası

> **Durum:** Taslak · 16 Ekim 2026 · Bu belge karar vermez, **kararları birlikte vermek için zemin hazırlar.**
> Her karar başlığında seçenekler, artı/eksiler ve bir öneri var. Karar verildikçe `Karar:` satırı doldurulur ve tarih yazılır.
>
> İlgili belgeler: [ARCHITECTURE.md](ARCHITECTURE.md) (teknik mimari, veritabanı, 04:00 silme motoru) · [TASARIM.md](TASARIM.md) (tasarım sistemi, Liquid Glass, Mobbin araştırması)

---

## İçindekiler

1. [Ürün özü](#1-ürün-özü)
2. [Neredeyiz?](#2-neredeyiz)
3. [Kullanıcılar ve anlar](#3-kullanıcılar-ve-anlar)
4. [Çekirdek döngü](#4-çekirdek-döngü)
5. [Özellik beyin fırtınası](#5-özellik-beyin-fırtınası)
6. [Birlikte vereceğimiz kararlar](#6-birlikte-vereceğimiz-kararlar)
7. [Arayüz yaklaşımı ve Mobbin referansları](#7-arayüz-yaklaşımı-ve-mobbin-referansları)
8. [Güven, güvenlik ve hukuk](#8-güven-güvenlik-ve-hukuk)
9. [Büyüme: soğuk başlangıç problemi](#9-büyüme-soğuk-başlangıç-problemi)
10. [Başarıyı nasıl ölçeriz?](#10-başarıyı-nasıl-ölçeriz)
11. [Riskler ve varsayımlar](#11-riskler-ve-varsayımlar)
12. [Rota (fazlar)](#12-rota-fazlar)
13. [Karar günlüğü](#13-karar-günlüğü)
14. [Sıradaki adım](#14-sıradaki-adım)

---

## 1. Ürün özü

**Tek cümle:** Bulunduğun yerde, o an orada olan insanlarla — gece bitene kadar.

**Ne?** Konum bazlı, grup aktivitelerine odaklı bir sosyal medya uygulaması. Kullanıcı bir mekânda (konser, restoran, park, stadyum, festival…) **yer bildirir**, isterse fotoğraf veya yorum paylaşır. Paylaşım ana sayfada görünür. Yer bildiren kişi, o mekânda yer bildirmiş herkesle **mekânın grup sohbetine** katılır.

**Ne değil?**
- Bir tanışma (dating) uygulaması değil — odak birebir eşleşme değil, **grup**.
- Kalıcı bir sohbet uygulaması değil — **sohbetler her gece 04:00'te sıfırlanır.** Paylaşımlar (yer bildirimleri, yorumlar, fotoğraflar) kalır (K-16, 17.10.2026).
- Bir etkinlik bilet/organizasyon platformu değil (en azından başta).

**Üç ilke (tüm kararlar bunlara göre tartılır):**

| İlke | Anlamı | Bunu bozan bir özellik örneği |
|---|---|---|
| **Şimdi ve burada** | İçerik değeri anlıktır; geçmiş ve uzak önemsizdir | "Geçen ayın en iyi fotoğrafları" |
| **Sohbet iz bırakmaz** | Mekân sohbetleri ve mesajlar her gece 04:00'te sıfırlanır; paylaşımlar kalır (K-16) | Sohbet arşivi, kalıcı DM geçmişi |
| **Gerçekten oradaysan** | Mekân sohbetine yalnızca yer bildirerek girilir; yer bildirimi yalnızca mekânın 300 m yakınında (K-17) | Evden yer bildirip sohbete katılma |

---

## 2. Neredeyiz?

| Alan | Durum |
|---|---|
| Teknik mimari ve teknoloji yığını | ✅ Önerildi ([ARCHITECTURE.md](ARCHITECTURE.md)) — onaylanmayı bekliyor |
| Veritabanı şeması + 04:00 silme motoru | ✅ Yazıldı, 80 test ile doğrulandı (ilk ürün modeline göre) |
| Ürün modeli güncellemesi (yer bildirimi + mekân sohbeti) | 🟡 Belirlendi, şemaya henüz işlenmedi |
| Arayüz | 🟡 Çalışan prototip var (`apps/mobile`, sahte veri). Mobbin araştırması ve tasarım sistemi hazır ([TASARIM.md](TASARIM.md)); sırada tasarım kararları ve Liquid Glass yeniden tasarımı |
| Ürün kararları | 🟡 Çekirdek kararlar kapandı (§13); K-04, K-06, K-07, K-10, K-12 ve beta/lansman açık |

---

## 3. Kullanıcılar ve anlar

Uygulama "kim" için değil, **"hangi an" için** tasarlanmalı. Aynı kişi farklı anlarda farklı ihtiyaç duyar.

| An | Kim? | İhtiyaç | Uygulamanın cevabı |
|---|---|---|---|
| **Konserde, kalabalıkta** | Arkadaşıyla ya da tek gelmiş genç | "Önde yer var mı? Bis olacak mı? Çıkışta kim nereye?" | Mekân sohbeti, planlar |
| **Tek başına bir etkinlikte** | Şehre yeni gelmiş, tek gelmiş | "Burada benim gibi tek gelen var mı?" | "Tek gelenler" planı, anonim mod |
| **Restoranda / barda** | Arkadaş grubu | "Burada şu an neler oluyor? Masa boşaldı mı?" | Paylaşımlar, canlı sayaç |
| **Evde, karar anı** | Çıkmak isteyen ama nereye bilmeyen | "Şu an nerede hareket var?" | Ana sayfa / harita, canlı mekânlar |
| **Maç / festival** | Büyük kalabalık | "Kapı 3'te kuyruk ne durumda?" | Mekân sohbeti, alt alanlar (bkz. K-07) |

**Açık soru:** Hedef yaş aralığı? (18–30 mu, daha geniş mi?) → K-01

---

## 4. Çekirdek döngü

```
   Keşfet ──────▶ Git ──────▶ Yer bildir ──────▶ Paylaş
     ▲                                              │
     │                                              ▼
  04:00'te                                   Mekân sohbetine gir
  sohbetler                                         │
  sıfırlanır ◀──── Plan yap / katıl ◀──────── Konuş, tanış
```

**"Aha!" anı:** Bir yere vardığında, sohbete girip *şu an aynı yerdeki* insanların ne konuştuğunu görmek. Bu an ilk açılışta yaşatılamazsa ürün tutmaz → soğuk başlangıç (§9) en büyük risk.

---

## 5. Özellik beyin fırtınası

Sınıflandırma: **Olmazsa olmaz** (MVP) · **Güçlü aday** (MVP+1) · **Belki** (sonra) · **Yapmayalım** (ilkelere aykırı)

### 5.1 Yer bildirimi
| Fikir | Sınıf | Not |
|---|---|---|
| Yakındaki mekân listesi + arama | Olmazsa olmaz | Mekân verisi nereden? → K-05 |
| Yakınlık doğrulama (~300 m) | Olmazsa olmaz | Sohbetin güveni buna bağlı |
| Fotoğraf ve/veya yorum (isteğe bağlı) | Olmazsa olmaz | |
| Profilimle / anonim seçimi | Olmazsa olmaz | Kapsamı → K-04 |
| "Yeni yer ekle" | Güçlü aday | Spam riski; moderasyon gerek |
| Arkadaşlarla birlikte yer bildirme | Belki | Arkadaş sistemi gerektirir → K-03 |
| Çıkış yapma ("Ayrıldım") | Güçlü aday | "Burada" sayacının doğruluğu → K-06 |
| Otomatik yer bildirimi (arka plan konumu) | Yapmayalım | Pil + gizlilik; ilke 2'ye aykırı |

### 5.2 Paylaşım ve akış
| Fikir | Sınıf | Not |
|---|---|---|
| Fotoğraf/yorum paylaşımı ana sayfada | Olmazsa olmaz | |
| Beğeni | Olmazsa olmaz | |
| Paylaşıma yorum | Güçlü aday | Moderasyon yükü artar |
| Yalnızca uygulama içi kamera (galeriden yükleme yok) | Belki | BeReal tarzı "gerçeklik"; sahte içeriği azaltır |
| Video (kısa) | Belki | Depolama + moderasyon maliyeti yüksek |
| Paylaşımı kalıcı kaydetme | Yapmayalım | İlke 2'ye aykırı |

### 5.3 Mekân sohbeti
| Fikir | Sınıf | Not |
|---|---|---|
| Mekân başına gecelik grup sohbeti | Olmazsa olmaz | |
| Yalnızca yer bildirenler girebilir | Olmazsa olmaz | |
| 04:00 geri sayımı | Olmazsa olmaz | Yalnızca sohbetlerde (K-16) |
| Fotoğraf gönderme | Güçlü aday | |
| Büyük mekânda alt sohbetler (Kapı 2, Sahne önü…) | Belki | 5 000 kişilik sohbet okunmaz → K-07 |
| Mesaja tepki (emoji) | Belki | |
| Birebir mesaj (DM) | Açık | Taciz riski vs. bağlantı kurma → K-08 |

### 5.4 Planlar (grup aktivitesi — ürünün farkı)
| Fikir | Sınıf | Not |
|---|---|---|
| Sohbette plan önerme (saat + buluşma noktası) | Güçlü aday | Grup aktivitesi odağının kalbi |
| "Ben de varım" + katılımcı listesi | Güçlü aday | |
| Plan 04:00'ü geçemez | Olmazsa olmaz | İlkeyle tutarlı |
| Hazır plan şablonları ("Tek gelenler buluşması", "Taksi paylaşımı", "Sonraki mekân") | Belki | Başlatmayı kolaylaştırır |
| Plana özel küçük sohbet | Belki | |

### 5.5 Keşif
| Fikir | Sınıf | Not |
|---|---|---|
| Canlı mekânlar (sayaçla) | Olmazsa olmaz | |
| Harita görünümü | Güçlü aday | |
| Kategori filtreleri | Güçlü aday | |
| "Yakındaki kişiler" listesi | Yapmayalım (?) | Tanışma uygulamasına kayar; takip/taciz riski → K-02 ile birlikte |

### 5.6 Profil ve sosyal bağ
| Fikir | Sınıf | Not |
|---|---|---|
| Kalıcı profil (ad, foto, biyografi, ilgi alanları) | Olmazsa olmaz | |
| Gecelik anonim takma ad | Olmazsa olmaz | |
| Yer bildirimleri profilde | Olmazsa olmaz | Kalıcı (K-16) |
| Arkadaş / takip | Açık | → K-03 |
| Rozetler, seri (streak), istatistik | Belki | Prototipte "gece pasaportu" olarak (T-22): son 30 gün, haftalık seri, gece takvimi; yalnızca karşılıklı takipleşenler görür. Geçmiş K-16 ile zaten tutuluyor; "Şimdi ve burada" ilkesiyle gerilim: profil geçmişi gösterir, akış ve sohbet anlık kalır |
| Birlikte olunan geceler | Belki | Prototipte (T-22): aynı gece aynı mekânda olunan geceler ve ortak mekânlar, başkasının profilinde |

### 5.7 Güvenlik
| Fikir | Sınıf | Not |
|---|---|---|
| Engelleme (kalıcı) | Olmazsa olmaz | Mağaza şartı |
| Şikâyet + 90 gün delil | Olmazsa olmaz | Mağaza şartı |
| İçerik filtresi (küfür/çıplaklık) | Olmazsa olmaz | |
| Telefon doğrulaması | Güçlü aday | Sahte hesapları azaltır → K-09 |
| 18+ yaş sınırı | Olmazsa olmaz (?) | → K-01 |

---

## 6. Birlikte vereceğimiz kararlar

Öncelik: 🔴 arayüzden önce şart · 🟡 arayüz sırasında · 🟢 sonra

### K-01 · Hedef kitle ve yaş sınırı 🔴
- **A) 18+** — Hukuki risk düşük, bar/konser içeriğiyle uyumlu. Lise/üniversite başı kitle dışarıda.
- **B) 16+ (16–17 ayrı kurallarla)** — Daha geniş kitle; ama reşit olmayanlar + konum + yabancılar = çok yüksek risk.
- **Öneri:** A. Konum + yabancılarla sohbet kombinasyonunda reşit olmayanlarla başlamak çok riskli.
- **Karar:** 🟡 **MVP için geçici: 18+** (16.10.2026). Kayıtta beyan edilen doğum tarihi (sonradan değiştirilemez, yalnızca destek düzeltir) + zorunlu telefon doğrulaması; mağaza derecelendirmesi 18+. Yaş sınırı kodda bir ayar değeri olarak tutulur, sonradan değiştirilebilir.
- **Kalıcı karar beta sonrası verilecek:**
  - 16–17 yaş için ayrı bir deneyim açılacak mı?
  - Selfie ile yaş tahmini mi, kimlik doğrulama mı (KVKK: biyometrik veri için açık rıza)?
  - Güçlü doğrulama herkese mi, yalnızca "reşit olmayan" şikâyeti alan hesaplara mı?

### K-02 · Ürünün kalbi: mekân mı, kişi mi? 🔴
- **A) Yalnızca mekân** — Keşif mekânlar üzerinden; kişiler yalnızca sohbette görünür.
- **B) Mekân + yakındaki kişiler** — Daha çok bağlantı; ama tanışma uygulamasına kayma ve takip riski.
- **Öneri:** A. Senin tarifin ("grup aktiviteleri, tanışma değil") ile birebir uyumlu.
- **Karar:** ✅ **A · Mekân** (16.10.2026). Keşif yalnızca mekânlar üzerinden yapılır; haritada ve listede kişi yok, "yakındaki kişiler" ekranı yok. Kişiler yalnızca bir mekânın içinde görünür: sohbette, planlarda ve "burada kimler var" listesinde.
- **Yer bildirme akışı (karar):** "Buradayım" denince yalnızca yakındaki mekânlar listelenir, kullanıcı içinde bulunduğunu seçer. Uzaktaki bir mekân seçilemez.

### K-03 · Arkadaş / takip sistemi 🔴
- **A) Yok** — Tamamen anlık; ama kullanıcıyı geri getiren bir bağ da yok.
- **B) Karşılıklı arkadaşlık** — Arkadaşların nerede olduğunu (isterse) görür; geri dönüş nedeni.
- **C) Tek yönlü takip** — Sosyal medya hissi; ama "popüler hesap" dinamiği ve takip/izleme riski.
- **Öneri:** MVP'de A, ardından B. "Arkadaşların bu gece nerede" güçlü bir geri dönüş nedeni olabilir.
- ~~Karar: B · Karşılıklı arkadaşlık~~ → **güncellendi:**
- **Karar:** ✅ **C · Tek yönlü takip, MVP'de var** (16.10.2026). Instagram / X gibi "takip et / takibi bırak". Kişiler birbirinin profilini görebilir. Takip ilişkisi kalıcıdır (`core` şeması); paylaşımlar ve sohbetler yine 04:00'te silinir.
- **Kitle seçimi (karar):** Paylaşım ekranında kitle seçilir; **varsayılan "Herkes"**. Kullanıcı değiştirirse son seçimi hatırlanır ve sonraki paylaşımlarda o kullanılır.
- **Rehberden kişi bulma:** ❌ Şimdilik yok. Kişiler **kullanıcı adıyla** aranıp bulunur (bkz. K-15).
- ⚠️ **Tek yönlü takibin riski:** Takip onay gerektirmediği için bir yabancı birini takip edip onun yer bildirimlerini anlık izleyebilir. Önlemler (**karar, 16.10.2026**, tümü kullanıcının tercihine bağlı):
  - **Gizli hesap:** isteğe bağlı bir ayar, varsayılan kapalı (hesaplar açık). Açılırsa takip istek/onay ile olur, onaylanmayan kişi paylaşımları görmez.
  - **"Şu an burada" görünürlüğü:** varsayılan **sadece karşılıklı takipleşenler**. Kullanıcı ayarlardan değiştirebilir (Herkes / Karşılıklı takipleşenler / Kimse). Tek yönlü takipçi varsayılan durumda sadece paylaşımın kendisini görür.
  - Takipçiyi çıkarma ve engelleme her zaman açık.
- **Açık alt sorular:**
  - Arkadaşlar birbirinin bu gece **nerede** yer bildirdiğini görsün mü (ör. ana sayfada "Ayşe şu an Liman Açıkhava'da")? Varsayılan açık mı kapalı mı?
  - Arkadaş olmayan biri profilde ne görür: ad, foto, biyografi, ilgi alanları evet; bu geceki yer bildirimleri?
  - Anonim yer bildirimi yapan birinin profiline sohbetten **gidilemez** (takma ad profile bağlanmaz).
  - Arkadaş isteği de bir taciz kanalı olabilir: istekte mesaj yok, gece başına istek sınırı, engellenen kişi tekrar istek atamaz.

### K-04 · Anonimlik kapsamı 🟡
- **A) Gece başına tek takma ad** (şu an veritabanında böyle).
- **B) Mekân başına farklı takma ad** — Daha anonim; gece içinde tutarlılık kaybolur.
- **C) Anonim mod yok** — Daha az taciz; daha az özgürlük.
- **Öneri:** A.
- **Karar:** ⬜

### K-05 · Mekân verisi nereden gelecek? 🔴
- **A) Google Places API** — En kapsamlı; ama ücretli ve önbellekleme kısıtları var.
- **B) Foursquare Places API** — Yer bildirimi geçmişi olan, kategori zengini.
- **C) OpenStreetMap** — Ücretsiz; Türkiye'de kapsam düzensiz.
- **D) Kendi listemiz + kullanıcı ekleme** — Tam kontrol; başlangıçta boş.
- **Güncel öneri (16.10.2026):** **A · Google Places API (New), "Nearby Search"**, sunucu üzerinden ve önbellekli. Konser, festival ve maç gibi geçici etkinlikler için kendi "etkinlik" kayıtlarımız eklenir.
  - **Fiyat:** Nearby Search, yalnızca temel alanlar (ad, adres, konum) istenirse "Pro" seviyesinden ücretlenir. Ayda 5 000 çağrı ücretsiz, sonrası 1 000 çağrı başına yaklaşık 32 $. Puan, açılış saati gibi alanlar istenirse daha pahalı "Enterprise" seviyesine çıkar, bu yüzden yalnızca gereken alanlar istenmeli. (Rakamlar üçüncü taraf kaynaklardan; Google'ın resmî fiyat sayfasından doğrulanmalı.)
  - **Kural:** Google içeriği Google olmayan bir haritada gösterilemez. Bu yüzden harita görünümünde mimarideki MapLibre yerine Google Maps kullanılması gerekir.
  - **Kural:** Önbellekleme sınırlı (genel kural en fazla 30 gün). Kendi veritabanımızda `place_id` ve kendi verimiz tutulur.
- **Kaba aylık maliyet tahmini (16.10.2026):**

  | Senaryo | Günlük aktif kullanıcı | "Buradayım" açılışı / ay | Önbellek isabeti | Tahmini maliyet / ay |
  |---|---|---|---|---|
  | Beta (tek semt) | 500 | 9 000 | %50 | **≈ 0 $** (ücretsiz kotada) |
  | İstanbul lansmanı | 10 000 | 240 000 | %70 | **≈ 2 400 $** (kullanıcı başına ≈ 0,24 $) |
  | Türkiye geneli | 100 000 | 2 400 000 | %80 | **≈ 17 000 $** (kullanıcı başına ≈ 0,17 $) |

  Varsayımlar: Nearby Search "Pro" 1 000 çağrı başına 32 $, ayda 5 000 ücretsiz, 100 bin üstü kademeli indirim. Açılışların %20'sinde mekân araması yapılır, aramaların %70'i önce kendi mekân tablomuzdan cevaplanır. Yanıtlar ~250 m'lik hücre başına birkaç saat önbellekte tutulur. Rakamlar üçüncü taraf kaynaklara dayanıyor; Google'ın resmî fiyat sayfasından doğrulanmalı.
- **Maliyeti düşürme kuralları:**
  - Yalnızca temel alanlar istenir (ad, adres, konum, tür). Puan, saat ve fotoğraf istenmez; mekân fotoğrafları kullanıcı paylaşımlarından gelir.
  - Sunucu tarafında hücre bazlı önbellek; istemci Google'ı doğrudan çağırmaz (API anahtarı da sunucuda kalır).
  - Google Cloud'da bütçe uyarısı ve günlük kota tanımlanır.
- **Kural:** Google'dan gelen koordinatlar en fazla 30 gün saklanabilir; `place_id` süresiz saklanabilir. Bu yüzden `core.venues` kaydının koordinatı periyodik olarak yenilenir.
- **Karar:** ✅ **Google Places API (New)** (16.10.2026): Nearby Search (yalnızca temel alanlar) + mekân araması, sunucu üzerinden ve önbellekli. Mekânlar `core.venues` tablosunda `place_id` ile tutulur. Konser, festival ve maç gibi geçici etkinlikler kendi kayıtlarımızla eklenir. Harita ekranında Google Maps kullanılır.

### K-06 · "Burada" ne kadar sürer? 🟡
- **A) 04:00'e kadar** — Basit; ama sayaç şişer (eve gitmiş biri hâlâ "burada").
- **B) Sabit süre (ör. 3 saat)** — Makul; bazen erken düşer.
- **C) Ayrılınca / başka yere bildirince** — En doğru; kullanıcı eylemine bağlı.
- **Öneri:** B + C (3 saat veya başka yere bildirene / "Ayrıldım" diyene kadar). Sohbete okuma erişimi 04:00'e kadar sürsün.
- **Karar:** ⬜

### K-07 · Büyük mekânlarda sohbet ölçeği 🟢
- **A) Tek sohbet** — Basit; 1 000+ kişide okunmaz.
- **B) Alt sohbetler** (bölge/kapı/sahne).
- **C) Rastgele küçük gruplar** (ör. 50'şer kişi).
- **Öneri:** MVP'de A, eşik aşılırsa B.
- **Karar:** ⬜

### K-08 · Birebir mesaj (DM) 🔴
- **A) Yok** — En güvenli; grup odağı net.
- **B) Var, istek/onay ile** — Bağlantı kurma kolay; taciz yüzeyi büyür.
- **C) Yalnızca aynı plana katılanlar arasında**.
- **Öneri:** C. Grup aktivitesinden doğan bağlantıya izin verir, rastgele DM'yi engeller.
- **DM modeli (karar, 16.10.2026):** DM geldiğinde **mesaj isteği** gibi çalışır. Kim yazarsa yazsın, profil gizli olsun olmasın, ilk mesaj gelen kutusuna değil **"İstekler"** bölümüne düşer. Alıcı kabul ederse sohbet gelen kutusuna taşınır; reddederse ya da görmezden gelirse gönderen bunu bilmez. **İstisna:** karşılıklı takipleşenlerin mesajı doğrudan gelen kutusuna düşer. 
- **Karar:** ✅ **Mesajlaşma MVP'de var** (16.10.2026), yukarıdaki istek modeliyle. ~~Önceki karar: MVP'de DM yok, ama kapı açık.~~ Önerilen güvenlik kuralları: istekteki ilk mesajda fotoğraf/link yok, kabul edilmeden ikinci mesaj gönderilemez, kişi başına günlük istek sınırı, engellenen kişi yazamaz. Mesajlar da 04:00'te silinir (ilke 2); takip ilişkisi kalıcı olduğu için sohbet ertesi gün boş olarak yeniden başlayabilir.
- **Eski not (16.10.2026):** Veritabanındaki birebir sohbet yapısı (`conversations.kind = 'direct'`, istek → kabul) korunur, sadece arayüzde açılmaz. İleride en olası yol C: aynı plana katılanlar arası, istek/onaylı, 04:00'te silinen DM.

### K-09 · Kayıt yöntemi 🔴
- **A) Telefon OTP** — Sahte hesap az; SMS maliyeti, numara saklama (HMAC ile çözülü).
- **B) Apple / Google ile giriş** — Sürtünmesiz; sahte hesap daha kolay.
- **C) İkisi birden** (telefon zorunlu + sosyal giriş).
- **Öneri:** C.
- **Karar:** ✅ **Hepsi MVP'de** (16.10.2026): telefon + SMS kodu (zorunlu, K-01) + Apple ile giriş + Google ile giriş + e-posta (isteğe bağlı, hesap kurtarma için).
  - **İlk kayıtta telefon doğrulaması her zaman zorunlu.** Apple / Google, sonraki girişleri tek dokunuşa indirir ve telefonunu kaybedenler için kurtarma yolu olur.
  - **Apple ile giriş:** iOS'ta `expo-apple-authentication`. Android'de Apple girişi web akışı gerektirdiği için ilk aşamada yalnızca iOS'ta sunulur (Apple'ın kuralı yalnızca iOS uygulaması için geçerli).
  - **Teknik notlar:**
    - Apple ad ve e-postayı yalnızca ilk girişte verir; o an kaydedilmeli.
    - "E-postamı gizle" seçeneğiyle gelen yönlendirme adreslerine mail atabilmek için alan adımızı Apple'a kaydetmemiz gerekir.
    - Hesap silindiğinde Apple jetonları API ile iptal edilmeli (Apple şartı).
    - Google girişi Expo Go'da çalışmaz; geliştirme derlemesi (dev build) gerekir.
  - **Güvenlik:** SMS kodu isteğine numara, cihaz ve IP başına sınır (SMS dolandırıcılığına karşı).
  - **Kayıt akışı:** telefon → SMS kodu → doğum tarihi (18+) → görünen ad + `@kullanıcı adı` → profil fotoğrafı (isteğe bağlı) → ilgi alanları (en az 3) → konum izni (uygulama açıkken).

### K-10 · Gece sınırı ve saat dilimi 🟡
- 04:00'te sıfırlanma sabit mi? 03:59'da başlayan sohbet 1 dakika yaşar (03:30 sonrası uyarı gösterilebilir).
- Lansman Türkiye, tek saat dilimi (`Europe/Istanbul`) varsayıldı.
- **Karar:** ⬜

### K-11 · Platform ve lansman şehri 🔴
- iOS + Android birlikte mi (Expo ile mümkün), önce biri mi?
- Lansman: tek şehir/semt (ör. Kadıköy + Beşiktaş) mı, tüm İstanbul mu? → §9
- **Karar (kısmi, 16.10.2026):** ✅ **Platform: iOS + Android birlikte** (Expo). Öncelik, çalışan prototipi bir iPhone'da (Expo Go / simülatör) deneyimlemek. ⬜ Beta büyüklüğü, açık/kapalı beta ve lansman semti sonra kararlaştırılacak.

### K-12 · Gelir modeli 🟢
- Mekân ortaklıkları (öne çıkarma, "bu gece burada" duyurusu), etkinlik/bilet ortaklığı, premium (ör. anonim profil özelleştirme), reklam.
- **Öneri:** MVP'de gelir yok; ama mekân tarafını (mekân hesabı) şemada baştan düşünmek.
- **Karar:** ⬜

### K-14 · Ana sayfa akışı 🟡
- **Güncelleme (17.10.2026):** Ana sayfa artık mekân odaklı bölümlerle başlıyor; iki sekmeli akış "Paylaşımlar" bölümünün içinde (TASARIM.md T-20).
- **Karar:** ✅ **İki sekmeli akış** (16.10.2026):
  - **Sana özel:** takip ettiklerinin bu geceki paylaşımları + ilgi alanlarına uyan yakındaki mekânlardan paylaşımlar.
  - **Çevrende** (önceki adı "Rastgele"; T-9 ile değişti, 17.10.2026): yakındaki herkese açık paylaşımlardan karışık bir akış.
- **MVP sıralaması basit kalır:** Sana özel = arkadaşlar önce, sonra ilgi alanı eşleşmesi, sonra yakınlık. Rastgele = yakınlık + yenilik + biraz rastgelelik. Öneri algoritması MVP sonrası.
- **Açık:** Arkadaşı olmayan yeni kullanıcı "Sana özel"de ne görür? (Öneri: ilk günlerde ilgi alanlarına göre doldur, boş bırakma.)
- Bu karar, §7'deki "ana sayfa: akış mı, harita mı" sorusunu akış lehine kapatır; harita ayrı bir sekme olarak kalabilir.

### K-15 · Kullanıcı adı ve görünen ad 🔴
- **Karar:** ✅ **X (Twitter) modeli** (16.10.2026). Her profilde iki ad var:
  - **Görünen ad:** büyük ve kalın yazılır, serbest metin (ör. **Elif Yılmaz**). Benzersiz olmak zorunda değil, istenildiği zaman değiştirilebilir.
  - **Kullanıcı adı:** küçük, `@` ile yazılır (ör. `@elifyilmaz`). Benzersizdir; arama ve bulunma bununla yapılır.
- **Önerilen kurallar (onay bekliyor):**
  - `@` adı 3–20 karakter; yalnızca küçük harf `a–z`, rakam, `_` ve `.`. Türkçe karakterler `@` adında yok (ç→c, ğ→g…), görünen adda serbest.
  - Büyük/küçük harf duyarsız benzersizlik (`@Elif` ve `@elif` aynı ad).
  - Ayrılmış adlar alınamaz (`@here`, `@iamhere`, `@destek`, `@admin`…).
  - `@` adı en fazla 30 günde bir değiştirilebilir. Bırakılan ad 14 gün başkasına verilmez (taklit edilmesini önlemek için).
  - Görünen ad 1–40 karakter.
- **Şemaya etkisi:** `core.profiles` tablosuna benzersiz `username` alanı eklenecek (`display_name` zaten var); kullanıcı adı aramasına indeks.

### K-16 · 04:00'te ne sıfırlanır? 🔴
- **Karar:** ✅ **Yalnızca sohbetler** (17.10.2026). Mekân sohbetleri, birebir mesajlar, mesaj istekleri ve sohbetteki planlar her gece 04:00'te (İstanbul) sıfırlanır.
- **Kalıcı:** paylaşımlar (yer bildirimleri, yorumlar, eklenen fotoğraflar). Ana sayfada, mekân sayfasında ve profilde görünmeye devam eder.
- **Arayüz:** "Her şey 04:00'te silinir" yazıları kaldırıldı; ana sayfa ve Keşfet'teki genel sayaç kalktı. Sayaç ve "her gece 04:00'te sıfırlanır" notu yalnızca sohbetlerde (sohbet başlığı, Mesajlar).
- **Etkisi:** Veritabanında paylaşımlar ve yer bildirimleri `ephemeral` şemasından kalıcı tablolara taşınmalı (Faz 2). Gizlilik vaadi "sohbetler silinir" olarak yeniden yazılmalı; paylaşımlar için saklama süresi (KVKK) ayrıca belirlenmeli.
- **Açık:** Paylaşımı kullanıcı sonradan silebilsin mi (öneri: evet, her paylaşımın ••• menüsünde)? Akış ne kadar eskiye gitsin (öneri: önce son 24 saat, sonra daha eski)?

### K-17 · Sohbete kim girebilir? 🔴
- **Karar:** ✅ (17.10.2026) Mekân sohbetine **yalnızca yer bildirerek** girilir; yer bildirimi **yalnızca mekânın 300 m yakınında** yapılabilir. Evden "X mekânındayım" deyip sohbete katılmak yok.
- **Prototipte:** Uzaktaki mekânda yer bildirim sayfası nedenini açıklar ve düğme kapalıdır ("Mekânda olmalısın"); kilitli sohbette de aynı. Kural veri katmanında da uygulanır (uzak mekânda yer bildirimi ve sohbete yazma reddedilir).
- **Üründe:** Konum sunucuda doğrulanır (konum + doğruluk yarıçapı); sahte konuma karşı önlemler §8 kapsamında.

### K-13 · Ürün adı ve kimliği 🟢
- **Karar:** ✅ (16.10.2026)
  - **Mağaza adı:** **I am Here** (App Store Connect / Google Play'deki uygulama adı)
  - **Etiket / kampanya:** **#iamhere**
  - **Simge ve uygulama içi:** **HERE**. Ana ekranda simgenin altında "HERE" yazar (`app.json` → `name`); simgede ve ana sayfada vektör HERE logosu var (`scripts/generate-brand.py`).
  - **Renkler:** Winter Haze #D9DEE5 + Wild Fuchsia #E11D49 (açık mod); siyah + fuşya (koyu mod). Kurallar ve ayrıntılar [TASARIM.md](TASARIM.md)'de.
- ⚠️ **Marka ve mağaza riski (yayından önce kontrol edilmeli):**
  - "HERE", konum ve harita alanında çok bilinen bir marka: HERE Technologies (HERE WeGo uygulaması). Bizim ürün de konum bazlı olduğu için aynı sınıflarda (yazılım, konum hizmetleri) marka çakışması riski var. TÜRKPATENT ve EUIPO'da marka araştırması yapılmalı, gerekirse bir marka avukatına danışılmalı.
  - App Store ve Google Play'de uygulama adları benzersiz olmalı; tek başına "HERE" büyük olasılıkla alınamazdı. Mağaza adının **"I am Here"** olması bu sorunu büyük ölçüde çözüyor, ama "I am Here" adının da mağazalarda boş olduğu kontrol edilmeli.
  - Alan adı (`here.app`, `herenow.app` vb.) ve sosyal medya kullanıcı adlarının uygunluğu kontrol edilmeli.

---

## 7. Arayüz yaklaşımı ve Mobbin referansları

**Yaklaşım:** Önce kararlar (§6) → sonra **akış haritası** (ekran listesi) → her akış için Mobbin'den referans → düşük çözünürlüklü taslak → görsel dil → yüksek çözünürlüklü tasarım.

> **Güncelleme:** Derin Mobbin araştırması (4 konu, 62 arama) tamamlandı. Ekran ekran öneriler, tasarım sistemi ve Liquid Glass ilkeleri artık [TASARIM.md](TASARIM.md)'de. Aşağıdaki tablo ilk taramadır; tarihçe için duruyor.

İlk taslak iptal edildi. Aşağıdaki referanslar Mobbin'den ilk tarama.

| Akış | Referans | Neden ilgili |
|---|---|---|
| Yer bildirimi (tam akış) | [Swarm · Logging a check-in](https://mobbin.com/flows/b085bdb2-fca9-47b6-bb94-e32e8a110c48) | Mekân + yorum + fotoğraf + "özel yer bildirimi" anahtarı tek ekranda |
| Fotoğraf ekleme | [Swarm · Uploading a photo](https://mobbin.com/flows/f4988b94-f9eb-418a-b6c1-10e38738b7c4) | Hızlı galeri seçimi |
| Mekân seçip paylaşım | [corner · Creating a post](https://mobbin.com/flows/38d5ed12-157e-4896-9411-6ab275c7e10b) | Mekân listesi → paylaşım, yumuşak görsel dil |
| Konum arama | [Hypelist · Adding a location](https://mobbin.com/flows/41edcabd-0312-4cb0-a159-a8026447b7e0) | Basit arama sonuç listesi |
| Etkinlik grup sohbeti | [Luma · Event chat](https://mobbin.com/screens/a01372cf-4ca3-43fb-a68a-a737fc11032f) | Etkinliğe bağlı sohbet, karşılama mesajı |
| Katılım + yorumlar | [Meetup · Event comments](https://mobbin.com/screens/f524b867-cbd4-407f-ae29-81b021071026) | "You're going" alt çubuğu — plan katılımı için örnek |
| Plan kartı | [Rodeo · Coming up](https://mobbin.com/screens/360cff12-b1fc-44f0-809f-67df4b13d94b) | "Doing it" etiketiyle plan kartı |
| Harita + etkinlik listesi | [Luma · Events map](https://mobbin.com/screens/52ce8173-ab47-4234-b4d0-6d08299e324f) | Harita üzerinde etkinlikler + alt panel listesi |
| Harita + mekân kartı | [Tripadvisor · Map](https://mobbin.com/screens/47ef9950-448a-43fa-a469-1d4ff6330880) | Pin + alttaki yatay kart |
| Harita + alt panel liste | [Fresha · Map search](https://mobbin.com/screens/9c6ec1d7-3de4-4f92-9897-8b8b28e5b17c) | Sürüklenebilir alt panel, filtreler |
| Harita + kategori çipleri | [Rodeo · Map](https://mobbin.com/screens/990a7f50-f867-498b-bd84-9557125ec1e9) | Altta kategori çipleri + arama |
| Sohbette konum paylaşma | [Messages · Send pin](https://mobbin.com/screens/a110612d-1b30-43b4-81d5-dc549d5b5fe5) | Buluşma noktası paylaşımı |

**Mobbin'de taranan konular** ([TASARIM.md §5](TASARIM.md#5-ekran-ekran-öneriler)): kayıt (telefon kodu, yaş, konum izni) · akış · yer bildirimi · mekân · harita · mesajlar ve istekler · sohbet ve plan kartı · profil · ayarlar · geri sayım · boş durumlar. **Sonra taranacak:** engelle/şikâyet akışı · bildirim ayarları · profil düzenleme.

**Arayüz için açık sorular** (yanıtlandı):
- ~~Ana sayfa: akış mı, harita mı, mekân kartları mı?~~ → İki sekmeli akış (K-14); harita Keşfet sekmesinde.
- ~~Görsel dil: gece/koyu mu, aydınlık mı?~~ → Sistem temasına uyar. Koyu mod temel tasarım (siyah + fuşya), açık mod eşdeğeri (Winter Haze + fuşya); bol Liquid Glass ile iOS 27 uyumu ([TASARIM.md §2](TASARIM.md#2-liquid-glass-ve-ios-27)).
- Sekme yapısı → 5 yerel sekme (Ana Sayfa · Keşfet · Buradayım · Mesajlar · Profil), "Buradayım" ortada. Yerel sekme mi, yükseltilmiş özel buton mu: [TASARIM.md T-1](TASARIM.md#6-raporlar-arasındaki-çelişkiler-ve-karar-önerileri).

---

## 8. Güven, güvenlik ve hukuk

| Konu | Neden önemli | Durum |
|---|---|---|
| **KVKK** | Konum kişisel veri; açık rıza + aydınlatma metni şart | Hukukçu görüşü gerekli |
| **5651 sayılı Kanun** | Yer sağlayıcıya trafik kaydı (IP, zaman) saklama yükümlülüğü — "iz bırakma" vaadiyle gerilim | Hukukçu görüşü gerekli |
| **Mağaza kuralları** | Kullanıcı içerikli uygulamalarda şikâyet, engelleme, filtre ve hızlı müdahale zorunlu | Şemada var |
| **Konum güvenliği** | Takip/ısrarlı takip riski | Ham GPS saklanmıyor; kişiler haritada yok (K-02) |
| **Gizlilik vaadi** | "Sohbetler 04:00'te silinir" vaadi (K-16) teknik olarak doğru olmalı (yedekler, loglar, push, cihaz) | [ARCHITECTURE.md §6](ARCHITECTURE.md) |
| **Moderasyon kapasitesi** | Gece yoğunluğunda şikâyetlere kim bakacak? | Plan yok → MVP öncesi netleşmeli |

---

## 9. Büyüme: soğuk başlangıç problemi

Boş bir mekân sohbeti, uygulamayı öldürür. Fikirler:

1. **Dar başla:** Tek semt + birkaç mekân (ör. 5–10 konser alanı/bar) ile lansman.
2. **Etkinlik odaklı açılış:** Büyük bir konser/festivalde "resmî gece sohbeti" olarak çıkış.
3. **Mekân ortaklıkları:** QR kod ile masada/girişte yer bildirimi ("Bu gece buradaki sohbete katıl").
4. **Üniversite toplulukları ve kulüpler:** Hazır gruplar.
5. **Tohum içerik:** Ekip ve elçiler (ambassador) ilk haftalarda aktif.

**Karar gereken:** Lansman şehri/semti ve ilk mekânlar → K-11

---

## 10. Başarıyı nasıl ölçeriz?

| Metrik | Neden | İlk hedef (tahmini, tartışılacak) |
|---|---|---|
| Yer bildirimi → sohbete mesaj oranı | "Aha" anı yaşandı mı? | %40+ |
| Gece başına aktif mekân sayısı | Ağ etkisi oluşuyor mu? | Lansman semtinde 20+ |
| Planlara katılım | Grup aktivitesi tutuyor mu? | Sohbetlerin %20'sinde en az bir plan |
| Haftalık geri dönüş (W1 retention) | Ürün alışkanlık oluyor mu? | %25+ |
| Şikâyet / 1 000 mesaj | Güvenlik sağlığı | Düşük ve düşen trend |

> Metrikler **toplam/anonim** tutulur; kişi bazlı geçmiş tutmak ilke 2'ye aykırı.

---

## 11. Riskler ve varsayımlar

| # | Risk | Etki | Azaltma |
|---|---|---|---|
| R1 | Soğuk başlangıç: sohbetler boş | Çok yüksek | Dar lansman, etkinlik ortaklığı (§9) |
| R2 | Taciz / güvenliksiz ortam | Çok yüksek | 18+, engelleme, filtre, DM kısıtı (K-08) |
| R3 | Konumla takip | Yüksek | Kişiler haritada yok, ham GPS yok |
| R4 | Sahte yer bildirimi (GPS sahteciliği) | Orta | Hız kontrolü, cihaz bütünlüğü kontrolü |
| R5 | Hukuki: 5651 / KVKK ile "iz bırakmama" çatışması | Yüksek | Erken hukuk görüşü |
| R6 | Silinen içerik nedeniyle geri dönüş nedeni yok | Orta | Arkadaş sistemi (K-03), bildirimler |
| R7 | Mekân verisi maliyeti | Orta | K-05 |

**Varsayımlar (doğrulanmalı):**
- İnsanlar yabancılarla *aynı mekânda* olunca konuşmaya isteklidir.
- 04:00 sıfırlanması bir kısıt değil, bir **cazibe** olarak algılanır.
- Grup planları, birebir tanışmadan daha güvenli ve daha çekici bulunur.

→ Bunları test etmek için: 5–10 hedef kullanıcıyla görüşme + basit tıklanabilir prototip.

---

## 12. Rota (fazlar)

```
Faz 0  Keşif ve kararlar      ← ŞU AN
Faz 1  Arayüz (Mobbin → akış haritası → taslak → tasarım)
Faz 2  Şemanın yeni modele uyarlanması
Faz 3  Backend MVP
Faz 4  Mobil MVP
Faz 5  Kapalı beta (tek semt)
Faz 6  Lansman
```

| Faz | Çıktı | Bitti sayılır, eğer… |
|---|---|---|
| **0 · Keşif ve kararlar** | Bu belge; 🔴 kararların tamamı | §6'daki tüm 🔴 kararlar dolduruldu |
| **1 · Arayüz** | Akış haritası, Mobbin referans panosu, düşük çözünürlüklü taslak, görsel dil, yüksek çözünürlüklü ekranlar | Çekirdek döngünün tüm ekranları (§4) onaylandı |
| **2 · Şema güncellemesi** | Mekânlar, yer bildirimi, paylaşımlar, planlar ([ARCHITECTURE.md §14](ARCHITECTURE.md)) | Paylaşımlar kalıcı tablolarda; testler sohbetler için 04:00 silmeyi doğruluyor (K-16) |
| **3 · Backend MVP** | API (NestJS), kimlik doğrulama, yer bildirimi, sohbet (WebSocket), medya, push | Uçtan uca: yakında yer bildir → sohbete yaz → 04:00'te sohbet sıfırlanır, paylaşım kalır |
| **4 · Mobil MVP** | Expo uygulaması | Gerçek cihazda çekirdek döngü çalışıyor |
| **5 · Kapalı beta** | Tek semt, davetle | §10 metrikleri ölçülüyor |
| **6 · Lansman** | Mağazalar, hukuki metinler, moderasyon süreci | Mağaza onayı + moderasyon nöbeti hazır |

**Faz 0 için yapılacaklar:**
- [x] 🔴 kararları (K-01, K-02, K-03, K-05, K-08, K-09, K-11) birlikte ver *(K-01 geçici; K-11'in beta/lansman kısmı açık)*
- [ ] Hukuk görüşü al (KVKK + 5651)
- [ ] 5 hedef kullanıcıyla kısa görüşme (varsayımları test et)
- [ ] Ürün adı ön kontrolü *(ad seçildi: mağazada I am Here, simgede HERE; marka ve mağaza kontrolü bekliyor, K-13)*

**Faz 1 için yapılacaklar:**
- [ ] Ekran listesi / akış haritası
- [x] Her akış için Mobbin referans seçimi ([TASARIM.md §5](TASARIM.md#5-ekran-ekran-öneriler))
- [x] Ana sayfa yaklaşımı kararı (K-14)
- [ ] Görsel dil (renk, tipografi, ikon) *(taslak hazır: [TASARIM.md §3–4](TASARIM.md#3-renk-sistemi); T-1…T-10 kararları bekliyor)*
- [ ] Düşük çözünürlüklü taslak → yüksek çözünürlüklü tasarım
- [ ] Liquid Glass yeniden tasarımı, iOS 27.1 simülatöründe ([TASARIM.md §7](TASARIM.md#7-uygulama-sırası))

---

## 13. Karar günlüğü

| Tarih | Karar | Gerekçe |
|---|---|---|
| 16.10.2026 | Teknoloji yığını önerildi: Expo + NestJS + PostgreSQL/PostGIS + Valkey | Tek dil (TypeScript), coğrafi sorgu, 04:00 için bölümleme |
| 16.10.2026 | Silme modeli: her şey yerel saatle 04:00'te silinir (bölüm düşürme + RLS) | Kesin ve kanıtlanabilir silme |
| 16.10.2026 | Ürün odağı: tanışma değil, **grup aktiviteleri**; merkezde yer bildirimi ve mekân sohbeti | Kullanıcı yönlendirmesi |
| 16.10.2026 | İlk arayüz taslağı iptal; arayüz için Mobbin referansları kullanılacak | Önce rota ve kararlar |
| 16.10.2026 | **K-02: Ürünün kalbi mekân.** Kişiler yalnızca mekân içinde görünür. Yer bildirirken yalnızca yakındaki mekânlar listelenir. | Grup aktivitesi odağı, güvenlik, yoğunluk (ağ etkisi) |
| 16.10.2026 | **K-08: MVP'de DM yok**, ama veritabanında altyapı korunuyor | Önce MVP; taciz yüzeyini küçük tut |
| 16.10.2026 | **K-03: Karşılıklı arkadaşlık MVP'de.** Profiller birbirine açık. | "Sosyal medya gibi" olmalı; geri gelme nedeni |
| 16.10.2026 | **K-14: Ana sayfa = "Sana özel" + "Rastgele" akışları** | Sosyal medya alışkanlığı; arkadaş + keşif dengesi |
| 16.10.2026 | **K-03 güncellendi: karşılıklı arkadaşlık yerine tek yönlü takip** | Sosyal medya alışkanlığı (Instagram/X) |
| 16.10.2026 | Kitle seçimi: varsayılan "Herkes", son seçim hatırlanır | Sürtünmesiz paylaşım, kullanıcı kontrolü |
| 16.10.2026 | Rehberden kişi bulma yok; kişiler kullanıcı adıyla bulunur | Gizlilik, KVKK yükü |
| 16.10.2026 | **K-15: Görünen ad + @kullanıcı adı (X modeli)** | Tanıdık kalıp, kullanıcı adıyla arama |
| 16.10.2026 | DM modeli: ilk mesaj "İstekler"e düşer; karşılıklı takipleşenlerin mesajı doğrudan gelen kutusuna | İstenmeyen mesajı gelen kutusundan uzak tut, tanıdıklar arasında sürtünme yaratma |
| 16.10.2026 | **K-08 güncellendi: mesajlaşma (istek modeliyle) MVP'de** | Sosyal medya beklentisi; takip ilişkisini anlamlı kılar |
| 16.10.2026 | **K-01 (geçici): MVP 18+**, beyan + telefon doğrulaması; kalıcı karar beta sonrası | Mağaza ve kayıt için kural gerekli; 18+ başlayıp genişletmek, daraltmaktan kolay |
| 16.10.2026 | **K-09: Telefon (zorunlu) + Apple + Google + e-posta (isteğe bağlı)**, hepsi MVP'de | Kolay giriş ve hesap kurtarma; telefon sahte hesaba karşı |
| 16.10.2026 | **K-05: Mekân verisi Google Places'tan**; sunucu önbelleği + kendi mekân tablomuz; harita Google Maps | En kapsamlı veri; maliyet İstanbul ölçeğinde aylık ≈ 2 400 $ |
| 16.10.2026 | **K-11 (kısmi): iOS + Android birlikte**; beta ve lansman kararı sonra | Expo tek kod tabanı; grup ürününde herkes katılabilmeli |
| 16.10.2026 | Çalışan prototip: `apps/mobile` (Expo SDK 58, sahte veri, backend yok) | Ürünü telefonda deneyimleyerek kararları test etmek |
| 16.10.2026 | Gizli hesap isteğe bağlı (varsayılan açık hesap); "şu an burada" varsayılan olarak sadece karşılıklı takipleşenlere, kullanıcı değiştirebilir | Takip + konum ile izlenme riskine karşı, kontrol kullanıcıda |
| 16.10.2026 | **K-13: Uygulama adı HERE**; renkler Winter Haze #D9DEE5 + Wild Fuchsia #E11D49, koyu modda siyah + fuşya | Kullanıcı yönlendirmesi |
| 16.10.2026 | **K-13 güncellendi:** mağaza adı **I am Here**, etiket **#iamhere**; simgede ve uygulama içinde **HERE** | Mağazada tek başına "HERE" büyük olasılıkla alınamaz; simgede kısa ad kalır |
| 16.10.2026 | Tasarım yönü: **bol Liquid Glass, iOS 27 ile tam uyum**, önce yerel bileşenler ([TASARIM.md](TASARIM.md)) | Kullanıcı yönlendirmesi; Xcode 27 ile derlenen uygulamada cam görünümü zaten kapatılamıyor |
| 17.10.2026 | **Tasarım kararları T-1…T-10 kabul edildi** ([TASARIM.md §6](TASARIM.md#6-raporlar-arasındaki-çelişkiler-ve-karar-önerileri)): Buradayım yerel sekme + cam aksesuar, fuşya sekme rengi, sistem yeşili anahtarlar, yerel segment, logo solda, metin renginde logo ve Takip et, akışta açık zemin, "Rastgele" → "Çevrende", kartlarda sayaç yok | Kullanıcı onayı |
| 17.10.2026 | Liquid Glass yeniden tasarımı uygulandı. iOS 27'de Buradayım **öne çıkan sekme** (sağda, kendi cam dairesinde); geniş ekranlarda sekmeler cam kenar çubuğunda | iOS 27'nin yerel karşılıkları. T-1'deki "ortada" konumundan sapma, **onay bekliyor** |
| 17.10.2026 | **T-11…T-15** ([TASARIM.md §6](TASARIM.md#6-raporlar-arasındaki-çelişkiler-ve-karar-önerileri)): her ekranda Klarna tarzı marka gradyanı (beyaz/siyah taban + fuşya ışık), ana sayfa üst barı içerikle kayar ve yalnız Dynamic Island çevresi bulanık kalır, paylaşım kartları Liquid Glass, yüzen kontrollerde daha net cam, Ayarlar'da Sistem / Açık / Koyu görünüm seçimi | Kurucu isteği; T-8'in (düz zemin) yerini T-11 aldı |
| 17.10.2026 | **K-16: 04:00'te yalnızca sohbetler sıfırlanır**; paylaşımlar, yorumlar ve fotoğraflar kalır. "Her şey silinir" yazıları ve ana sayfadaki sayaç kaldırıldı | Kurucu kararı; yer bildirimleri ana sayfalarda devam etsin |
| 17.10.2026 | **K-17: Sohbete yalnızca yer bildirerek, yer bildirimine yalnızca mekânın 300 m yakınında izin var** | Kurucu kararı; evden yer bildirip sohbete katılmak yok |
| 17.10.2026 | **T-16: Yazı tipi her yerde DM Sans**; **T-17: paylaşım kartları daha geçirgen** (net cam); kişilere sahte profil fotoğrafları | Kurucu isteği |
| 17.10.2026 | Zemin varyantları (T-18: A üst ışıklar · B üst + sağ alt · C geniş, Revolut gibi) ve ayarlardaki görünüm alanının üç seçeneği (T-19) Ayarlar › Tasarım denemesi'nde denenebilir | **Karar bekliyor** |
| 17.10.2026 | **K-14 güncellendi: ana sayfa mekân odaklı** (T-20): Takipleştiklerin şu an → Şu an canlı mekânlar → Bu gece etkinlikler → Paylaşımlar (Sana özel / Çevrende). Prototip verisi gerçekçi mekân fotoğrafları ve yorumlarla yenilendi | Kurucuyla tartışma: ürün "bir sosyal medya daha" gibi değil, "bu gece nereye?" sorusunun cevabı gibi görünmeli |
| 17.10.2026 | Mesajlar Instagram mesaj kutusu düzeninde yeniden kuruldu (T-21); Keşfet haritası gezilebilir hâle getirildi (yatay çip şeridi dokunuşları yutuyordu); Buradayım büyük başlığı kaldırıldı | Kurucu isteği |
| 17.10.2026 | **Profil = "gece pasaportu"** (T-22): son gecenin fotoğrafından kapak, son 30 gün (gece · mekân · semt, haftalık seri), gece takvimi, sık gidilen mekânlar, başlıksız Pinterest ızgarası (dokununca dikey akış), takipçi/takip listeleri; başkasının profilinde birlikte olunan geceler. Takvim ve istatistik yalnızca karşılıklı takipleşenlere açık. "Profili düzenle" küçük kapsül + Ayarlar › Hesap satırı | Kurucu: "sıradan olmasın ama kullanışlı olsun"; Mobbin öneri panosu üzerine kurucunun düzeltmeleriyle |

---

## 14. Sıradaki adım

**Kapanan kararlar:** K-01 (MVP için geçici: 18+), K-02 (mekân), K-03 (tek yönlü takip), K-05 (Google Places), K-08 (istek modeliyle mesajlaşma), K-09 (telefon + Apple + Google), K-11'in platform kısmı (iOS + Android), K-13 (ad ve renkler), K-14 (iki sekmeli akış), K-15 (görünen ad + @kullanıcı adı), K-16 (04:00'te yalnızca sohbetler sıfırlanır), K-17 (sohbete yalnızca yakında yer bildirerek).

**Sıradaki adımlar:**
1. ~~[TASARIM.md §6](TASARIM.md#6-raporlar-arasındaki-çelişkiler-ve-karar-önerileri)'daki tasarım kararlarını (T-1…T-10) birlikte ver.~~ ✅ Hepsi kabul edildi (17.10.2026).
2. 🟡 **Büyük ölçüde tamam (17.10.2026):** Mevcut ekranlar Liquid Glass ile yeniden tasarlandı ve iOS 27 simülatörlerinde test edildi ([TASARIM.md §7](TASARIM.md#7-uygulama-sırası)). Kalanlar: kayıt akışı, profil düzenleme ekranı, boş durumların tamamı, erişilebilirlik testleri.
3. Faz 2: şemayı yeni ürün modeline göre güncelle (mekânlar, yer bildirimi, paylaşımlar, planlar, takip, kullanıcı adı, mesaj istekleri; `anlik_*` adları `here_*` olacak). **K-16 gereği** paylaşımlar ve yer bildirimleri kalıcı tablolara taşınır; 04:00 silme motoru yalnızca sohbetleri (mesajlar, üyelik, istekler, planlar) kapsar.
4. 🟡 **Karar bekliyor:** T-18 (zemin A/B/C) ve T-19 (görünüm alanı 1/2/3). Ayarlar › Tasarım denemesi'nde denenip seçilecek; seçilmeyenler ve deneme bölümü kaldırılacak.

**Açık kararlar:** K-04 (anonimlik kapsamı), K-06 ("burada" süresi), K-07 (büyük mekânlarda sohbet ölçeği), K-10 (gece sınırı ve saat dilimi), K-11'in beta ve lansman kısmı, K-12 (gelir modeli).
