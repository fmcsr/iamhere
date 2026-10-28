// Prototip verisi. Backend gelene kadar uygulama tamamen bu veriyle çalışır.
// Mekân adları uydurmadır (park/meydan gibi kamusal yerler hariç).

export type Category = 'konser' | 'bar' | 'yemek' | 'kafe' | 'acik';

export type Venue = {
  id: string;
  name: string;
  category: Category;
  /** Semt / yer (kartlarda tek satır bilgi için). */
  area: string;
  distanceM: number;
  here: number;
  event?: string;
  latitude: number;
  longitude: number;
  /** Mekân sayfasının kapak fotoğrafı (16:10). */
  coverUri: string;
  /** "Bu gece" ızgarasındaki fotoğraflar. */
  nightPhotos: string[];
};

/** "Şu an burada kimler görsün" (ROTA §14 S4): Burada listesi, profildeki halka ve bu geceki yer bildirimi. */
export type PresenceVisibility = 'herkes' | 'karsilikli' | 'kimse';

export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  interests: string[];
  avatarColor: string;
  /** Sahte profil fotoğrafı (randomuser.me portresi); yüklenene kadar baş harf görünür. */
  avatarUri?: string;
  /** Kişinin seçtiği kapak fotoğrafı (net görünür). Yoksa kapak son gecenin fotoğrafı, bulanık. */
  coverUri?: string;
  isPrivate?: boolean;
  /** Varsayılan: karşılıklı takipleşenler. */
  presence?: PresenceVisibility;
};

/** Profilde seçilebilen ilgi alanları (en fazla 5). */
export const INTERESTS = [
  'Canlı müzik', 'Elektronik', 'Caz', 'Dans', 'Bar', 'Kokteyl', 'Şarap', 'Meyhane', 'Yemek', 'Sokak lezzetleri',
  'Kahve', 'Kutu oyunları', 'Stand-up', 'Tiyatro', 'Sinema', 'Fotoğraf', 'Kitap', 'Koşu', 'Açık hava', 'Sahil',
];
export const MAX_INTERESTS = 5;

export type Post = {
  id: string;
  userId: string;
  venueId: string;
  /** Fotoğrafın altındaki yazı (en fazla 150 harf, S3). */
  text?: string;
  /** Yalnızca yazıdan oluşan paylaşım yok (S3). */
  imageUri: string;
  createdAt: number;
  likes: number;
  /** Paylaşımda etiketlenen kişiler (profilde "Etiketlenenler"). */
  tagged?: string[];
};

/** Sohbette paylaşılan plan kartı ("Ben de varım"). Saati en geç 04:00 olabilir. */
export type Plan = {
  emoji: string;
  title: string;
  time: string;
  place: string;
  going: number;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string; // 'me' = ben
  text: string;
  plan?: Plan;
  createdAt: number;
};

export type Conversation =
  | { id: string; kind: 'venue'; venueId: string }
  | { id: string; kind: 'direct'; userId: string; status: 'inbox' | 'request' | 'sent' };

export const CHECK_IN_RADIUS_M = 300;

const min = (m: number) => Date.now() - m * 60_000;

const ISTANBUL_MS = 3 * 3_600_000;
/** d gece önceki gecenin 22:00'si (İstanbul) + dakika. Gece 04:00'e kadar sürer; 0 = bu gece. */
const night = (d: number, minutes = 0) => {
  const local = new Date(Date.now() + ISTANBUL_MS - 4 * 3_600_000);
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - d, 22) - ISTANBUL_MS + minutes * 60_000;
};
const face = (id: string) => `https://randomuser.me/api/portraits/${id}.jpg`;

export const ME: User = {
  id: 'me',
  username: 'elifyilmaz',
  displayName: 'Elif Yılmaz',
  bio: 'Canlı müzik, koşu ve iyi kahve. Hafta sonları Moda.',
  interests: ['Canlı müzik', 'Kahve', 'Koşu'],
  avatarColor: '#3B5BDB',
  avatarUri: face('women/44'),
};

export const USERS: User[] = [
  { id: 'u1', username: 'zeynep.k', displayName: 'Zeynep Kaya', bio: 'Konser fotoğrafçısı. Ön sıra benim.', interests: ['Canlı müzik', 'Fotoğraf'], avatarColor: '#7048E8', avatarUri: face('women/68') },
  { id: 'u2', username: 'mertdmr', displayName: 'Mert Demir', bio: 'Ocakbaşı uzmanı, meyhane müdavimi.', interests: ['Meyhane', 'Yemek'], avatarColor: '#C2410C', avatarUri: face('men/32'), presence: 'herkes' },
  { id: 'u3', username: 'canozturk', displayName: 'Can Öztürk', bio: 'Gece yürüyüşleri ve sahil.', interests: ['Koşu', 'Açık hava'], avatarColor: '#0B7285', avatarUri: face('men/75') },
  { id: 'u4', username: 'selin', displayName: 'Selin Aydın', bio: 'DJ setleri, çatı katları.', interests: ['Elektronik', 'Bar'], avatarColor: '#A61E4D', avatarUri: face('women/21'), isPrivate: true },
  { id: 'u5', username: 'arda_y', displayName: 'Arda Yıldız', bio: 'Kahve, kitap, kutu oyunları.', interests: ['Kahve', 'Kutu oyunları'], avatarColor: '#2B8A3E', avatarUri: face('men/46'), presence: 'herkes' },
  { id: 'u6', username: 'denizarslan', displayName: 'Deniz Arslan', bio: 'Meze haritası çıkarıyorum. Fava konusunda tartışmam.', interests: ['Meyhane', 'Yemek'], avatarColor: '#5F3DC4', avatarUri: face('women/32') },
  { id: 'u7', username: 'burakkoc', displayName: 'Burak Koç', bio: 'Burger ve gece sineması.', interests: ['Yemek', 'Kahve'], avatarColor: '#1864AB', avatarUri: face('men/22') },
  { id: 'u8', username: 'ece.sahin', displayName: 'Ece Şahin', bio: 'Küçük sahneler, akustik geceler.', interests: ['Canlı müzik'], avatarColor: '#C92A2A', avatarUri: face('women/90'), presence: 'kimse' },
  { id: 'u9', username: 'kerempolat', displayName: 'Kerem Polat', bio: 'Rakı-balık ehli.', interests: ['Meyhane'], avatarColor: '#5C940D', avatarUri: face('men/11') },
];

/** Takip listelerini dolduran diğer kişiler (paylaşımları yok; profil ve listelerde görünürler). */
const person = (id: string, username: string, displayName: string, portrait: string, avatarColor: string, bio = '', interests: string[] = []): User => ({
  id, username, displayName, bio, interests, avatarColor, avatarUri: face(portrait),
});

export const MORE_USERS: User[] = [
  person('e1', 'meliseren', 'Melis Eren', 'women/12', '#D6336C', 'Plak dükkânı, caz geceleri.', ['Canlı müzik']),
  person('e2', 'emrecelik', 'Emre Çelik', 'men/3', '#1971C2', 'Hafta içi kod, hafta sonu konser.', ['Canlı müzik', 'Bar']),
  person('e3', 'iremaksoy', 'İrem Aksoy', 'women/26', '#9C36B5', 'Moda’da yaşıyorum, sahil benim.', ['Koşu', 'Kahve']),
  person('e4', 'oguzkaplan', 'Oğuz Kaplan', 'men/14', '#E8590C', 'Ocakbaşı > her şey.', ['Yemek']),
  person('e5', 'duygutan', 'Duygu Tan', 'women/47', '#0C8599', 'Kahve demleme takıntılısı.', ['Kahve']),
  person('e6', 'bariskurt', 'Barış Kurt', 'men/28', '#2F9E44', 'Gece koşuları ve sabah kahvesi.', ['Koşu']),
  person('e7', 'cerenuysal', 'Ceren Uysal', 'women/57', '#C2255C', 'Teras barları listesi tutuyorum.', ['Bar']),
  person('e8', 'tolgaer', 'Tolga Er', 'men/36', '#3B5BDB', '', ['Elektronik']),
  person('e9', 'nazlierdem', 'Nazlı Erdem', 'women/63', '#AE3EC9', 'Fasıl olan her yerdeyim.', ['Meyhane']),
  person('e10', 'kaandogan', 'Kaan Doğan', 'men/52', '#F08C00', 'Burger kritikleri.', ['Yemek']),
  person('e11', 'busekilic', 'Buse Kılıç', 'women/79', '#E64980', 'Akustik her şey.', ['Canlı müzik']),
  person('e12', 'onursimsek', 'Onur Şimşek', 'men/60', '#1098AD'),
  person('e13', 'pinargunes', 'Pınar Güneş', 'women/85', '#7950F2', 'Kadıköy’ün kahvecilerini geziyorum.', ['Kahve']),
  person('e14', 'serkanyavuz', 'Serkan Yavuz', 'men/67', '#495057', 'Rakı, balık, muhabbet.', ['Meyhane']),
  person('e15', 'gizemacar', 'Gizem Acar', 'women/95', '#D9480F', 'DJ, Yeldeğirmeni.', ['Elektronik', 'Bar']),
  person('e16', 'utkubilgin', 'Utku Bilgin', 'men/83', '#5C7CFA', 'Stand-up ve küçük sahneler.', ['Canlı müzik']),
  person('e17', 'senabulut', 'Sena Bulut', 'women/5', '#12B886', '', ['Koşu']),
  person('e18', 'alptekin', 'Alp Tekin', 'men/91', '#868E96', 'Gece fotoğrafçılığı.', ['Fotoğraf']),
];

/** Unsplash fotoğrafları (ücretsiz lisans), kategoriye göre seçildi: konser, ocakbaşı, meyhane, kahve… */
const photo = (id: string, width = 1080) => `https://images.unsplash.com/photo-${id}?w=${width}&q=75&auto=format&fit=crop`;

const IMG = {
  konserIsik: photo('1459749411175-04bf5292ceea'),
  konserSahne: photo('1470229722913-7c0e2dbbafd3'),
  konserKalabalik: photo('1501386761578-eac5c94b800a'),
  konserEller: photo('1540039155733-5bb30b53aa14'),
  konserRenk: photo('1514525253161-7a46d19cd819'),
  konserTuruncu: photo('1524368535928-5b5e00ddc76b'),
  konserGitar: photo('1565035010268-a3816f98589a'),
  konserKonfeti: photo('1533174072545-7a4b6ad7a6c3'),
  sahneSolist: photo('1718182146459-663f14e67feb'),
  sahneMikrofon: photo('1718180867951-964ccef2f37b'),
  sahneGrup: photo('1718182140778-4f2e00c81874'),
  sahneBar: photo('1543007630-9710e4a00a20'),
  kafeVitrin: photo('1501339847302-ac426a4a7cbb'),
  kafeLatte: photo('1541167760496-1628856ab772'),
  kafeMasa: photo('1497636577773-f1231844b336'),
  kafeDortFincan: photo('1529892485617-25f63cd7b1e9'),
  kafeFincan: photo('1593443320739-77f74939d0da'),
  sahilBank: photo('1743341116718-cf8d387141ac'),
  sahilIsiklar: photo('1627040019728-e5a2c27311a5'),
  sahilKopru: photo('1696586304899-c9949f0a55c8'),
  sahilKizKulesi: photo('1589656340187-81efdd4a0505'),
  ocakIzgara: photo('1632158929962-a929c9e87570'),
  ocakKarisik: photo('1555939594-58d7cb561ad1'),
  ocakSis: photo('1603360946369-dc9bb6258143'),
  ocakTavuk: photo('1605908580297-f3e1c02e64ff'),
  ocakAdana: photo('1620167790054-de54f34308bb'),
  barTeras: photo('1758165532022-a68f291317ba'),
  barGunbatimi: photo('1770021601385-af0bf0136762'),
  barManzara: photo('1493246318656-5bfd4cfb29b8'),
  barKokteyl: photo('1566417713940-fe7c737a9ef2'),
  barKadeh: photo('1765130803583-a5de64bbcc70'),
  barDj: photo('1470225620780-dba8ba36b745'),
  meyhaneRaki: photo('1723191630811-1f25dcadc846'),
  meyhaneMeze: photo('1619941862585-cd4fa9a4c2cb'),
  meyhaneTabak: photo('1542528180-0c79567c66de'),
  meyhaneSalata: photo('1542444256-9dd3e45c9b81'),
  meyhaneMasa: photo('1647772809798-f34d785c981c'),
  burgerTepsi: photo('1550547660-d9450f859349'),
  burgerDouble: photo('1572802419224-296b0aeee0d9'),
  burgerKlasik: photo('1568901346375-23c9450c58cd'),
  burgerKoyu: photo('1571091718767-18b5b1457add'),
  burgerMarul: photo('1586190848861-99aa4a171e90'),
};

/** Fotoğrafların en/boy oranı. Üründe sunucu görselle birlikte gönderir; burada ölçülüp yazıldı. */
const ASPECT: Partial<Record<keyof typeof IMG, number>> = {
  konserIsik: 1.5, konserSahne: 1.5, konserKalabalik: 1.5, konserEller: 1.33, konserRenk: 1.33, konserTuruncu: 1.5, konserGitar: 0.67,
  konserKonfeti: 1.5, sahneSolist: 0.67, sahneMikrofon: 0.67, sahneGrup: 0.67, sahneBar: 0.75, kafeVitrin: 1.52, kafeLatte: 1.79,
  kafeMasa: 0.67, kafeDortFincan: 0.67, kafeFincan: 0.75, sahilBank: 1.57, sahilIsiklar: 1.5, sahilKopru: 0.75, sahilKizKulesi: 1.5,
  ocakIzgara: 0.67, ocakKarisik: 0.67, ocakSis: 0.75, ocakTavuk: 1.5, ocakAdana: 1.5, barTeras: 0.75, barGunbatimi: 1.5, barManzara: 1.5,
  barKokteyl: 1.43, barKadeh: 0.67, barDj: 1.5, meyhaneRaki: 0.56, meyhaneMeze: 0.56, meyhaneTabak: 1.48, meyhaneSalata: 1.47,
  meyhaneMasa: 0.67, burgerTepsi: 0.8, burgerDouble: 1.41, burgerKlasik: 1.2, burgerKoyu: 1.5, burgerMarul: 1.0,
};
const ASPECT_BY_URI = new Map(Object.entries(ASPECT).map(([key, aspect]) => [IMG[key as keyof typeof IMG], aspect]));

/** Görselin en/boy oranı; bilinmiyorsa 4:5. */
export const imageAspect = (uri?: string) => (uri && ASPECT_BY_URI.get(uri)) || 0.8;

/** Prototipte kullanıcının (sahte) konumu: Kadıköy, Rıhtım civarı. */
export const ME_LOCATION = { latitude: 40.9897, longitude: 29.0236 };

export const VENUES: Venue[] = [
  {
    id: 'v1', name: 'Rıhtım Açıkhava', category: 'konser', area: 'Rıhtım', distanceM: 120, here: 342, event: 'Gece Treni konseri · 21:00',
    latitude: 40.9905, longitude: 29.0225, coverUri: IMG.konserSahne,
    nightPhotos: [IMG.konserTuruncu, IMG.konserIsik, IMG.konserKalabalik, IMG.konserEller, IMG.konserGitar, IMG.konserKonfeti],
  },
  {
    id: 'v2', name: 'Kıyı Kahvesi', category: 'kafe', area: 'Caferağa', distanceM: 180, here: 12,
    latitude: 40.9893, longitude: 29.0241, coverUri: IMG.kafeVitrin, nightPhotos: [IMG.kafeLatte, IMG.kafeDortFincan, IMG.kafeMasa, IMG.kafeFincan],
  },
  {
    id: 'v3', name: 'Moda Sahili', category: 'acik', area: 'Moda', distanceM: 260, here: 41, event: 'Gece koşusu buluşması · 23:30',
    latitude: 40.9842, longitude: 29.0262, coverUri: IMG.sahilBank, nightPhotos: [IMG.sahilIsiklar, IMG.sahilKizKulesi, IMG.sahilKopru],
  },
  {
    id: 'v4', name: 'Nar Ocakbaşı', category: 'yemek', area: 'Kadıköy Çarşı', distanceM: 450, here: 27, event: '02:00’ye kadar açık',
    latitude: 40.9871, longitude: 29.0297, coverUri: IMG.ocakIzgara, nightPhotos: [IMG.ocakAdana, IMG.ocakKarisik, IMG.ocakSis, IMG.ocakTavuk],
  },
  {
    id: 'v5', name: 'Kule Teras', category: 'bar', area: 'Yeldeğirmeni', distanceM: 900, here: 86, event: 'DJ seti · 22:00',
    latitude: 40.9921, longitude: 29.0318, coverUri: IMG.barTeras, nightPhotos: [IMG.barGunbatimi, IMG.barManzara, IMG.barKokteyl, IMG.barKadeh, IMG.barDj],
  },
  {
    id: 'v6', name: 'Çınar Meyhane', category: 'yemek', area: 'Kadıköy Çarşı', distanceM: 230, here: 58, event: 'Fasıl · 22:00',
    latitude: 40.9885, longitude: 29.0258, coverUri: IMG.meyhaneRaki, nightPhotos: [IMG.meyhaneMeze, IMG.meyhaneMasa, IMG.meyhaneTabak, IMG.meyhaneSalata],
  },
  {
    id: 'v7', name: 'Dalga Burger', category: 'yemek', area: 'Caferağa', distanceM: 140, here: 19,
    latitude: 40.9899, longitude: 29.0252, coverUri: IMG.burgerTepsi, nightPhotos: [IMG.burgerDouble, IMG.burgerKlasik, IMG.burgerKoyu, IMG.burgerMarul],
  },
  {
    id: 'v8', name: 'Sahne Kadıköy', category: 'konser', area: 'Bahariye', distanceM: 380, here: 133, event: 'Akustik gece · 23:00',
    latitude: 40.9918, longitude: 29.027, coverUri: IMG.sahneSolist, nightPhotos: [IMG.sahneMikrofon, IMG.sahneGrup, IMG.sahneBar],
  },
  // Biraz uzaktakiler: yer bildirilemez (K-17) ama "To-HERE" listesine kaydedilir.
  {
    id: 'v9', name: 'Plak Odası', category: 'bar', area: 'Moda', distanceM: 650, here: 23, event: 'Plak gecesi · 22:30',
    latitude: 40.9846, longitude: 29.0305, coverUri: IMG.barDj, nightPhotos: [IMG.sahneBar, IMG.barKokteyl],
  },
  {
    id: 'v10', name: 'Haydarpaşa Sahnesi', category: 'konser', area: 'Haydarpaşa', distanceM: 1800, here: 210, event: 'Elektronik gece · 23:00',
    latitude: 40.9968, longitude: 29.0188, coverUri: IMG.konserRenk, nightPhotos: [IMG.konserEller, IMG.konserKalabalik],
  },
  {
    id: 'v11', name: 'Fener Balıkçısı', category: 'yemek', area: 'Fenerbahçe', distanceM: 2400, here: 34,
    latitude: 40.9712, longitude: 29.0371, coverUri: IMG.meyhaneSalata, nightPhotos: [IMG.meyhaneTabak, IMG.meyhaneRaki],
  },
  {
    id: 'v12', name: 'İskele Kahvesi', category: 'kafe', area: 'Kuzguncuk', distanceM: 6200, here: 9,
    latitude: 41.0362, longitude: 29.0297, coverUri: IMG.kafeMasa, nightPhotos: [IMG.kafeVitrin, IMG.kafeFincan],
  },
];

export const POSTS: Post[] = [
  { id: 'p1', userId: 'u1', venueId: 'v1', text: 'Gece Treni ikinci bise çıktı. Sahnenin önü bambaşka bir dünya, ses de tertemiz.', imageUri: IMG.konserTuruncu, createdAt: min(12), likes: 148 },
  { id: 'p6', userId: 'u6', venueId: 'v6', text: 'Fava, haydari, deniz börülcesi… Meze tabağı geldi, fasıl 22:00’de başlıyor. Favayı mutlaka deneyin.', imageUri: IMG.meyhaneMeze, createdAt: min(18), likes: 89 },
  { id: 'p2', userId: 'u4', venueId: 'v5', text: 'Terasta yer kalmadı ama DJ seti tam kıvamında. Manzara bedava.', imageUri: IMG.barTeras, createdAt: min(25), likes: 61 },
  { id: 'p7', userId: 'u7', venueId: 'v7', text: 'Double smash söyledim, cheddar akıyor. Patatesler çıtır, sos ev yapımı. 15 dakikada geldi.', imageUri: IMG.burgerDouble, createdAt: min(33), likes: 54 },
  { id: 'p3', userId: 'u2', venueId: 'v4', text: 'Acılı Adana efsane, yanına közlenmiş biber şart. 4 kişilik masa boşaldı, konserden çıkıp acıkan varsa bekleriz.', imageUri: IMG.ocakAdana, createdAt: min(41), likes: 37 },
  { id: 'p8', userId: 'u8', venueId: 'v8', text: 'Akustik gece başladı. Salon küçük ama ses harika, ön sıralar dolmak üzere.', imageUri: IMG.sahneSolist, createdAt: min(47), likes: 76 },
  { id: 'p4', userId: 'u3', venueId: 'v3', text: 'Sahilde 15 kişi olduk, 23:30’da koşuya çıkıyoruz. Hava serin, rüzgârlık alın.', imageUri: IMG.sahilBank, createdAt: min(55), likes: 30 },
  { id: 'p10', userId: 'u9', venueId: 'v6', text: 'Çınar’da rakı-balık masası kurduk, iki kişi daha sığar. Fasıl başlamadan gelin.', imageUri: IMG.meyhaneRaki, createdAt: min(64), likes: 18 },
  { id: 'p5', userId: 'u5', venueId: 'v2', text: 'Flat white’ları hâlâ Kadıköy’ün en iyisi. Arka masada kutu oyunu kuruldu, iki kişi eksiğiz.', imageUri: IMG.kafeLatte, createdAt: min(70), likes: 22 },
  { id: 'p9', userId: 'u1', venueId: 'v1', text: 'Kapılar açıldı, ışık provası yapılıyor. Erken gelen sahnenin sol tarafını kapsın.', imageUri: IMG.konserIsik, createdAt: min(150), likes: 95 },
  { id: 'p13', userId: 'u7', venueId: 'v2', text: 'Akşam kahvesi molası: dört fincan, dört farklı desen. Barista bugün formunda.', imageUri: IMG.kafeDortFincan, createdAt: min(190), likes: 27 },
  { id: 'p11', userId: 'u6', venueId: 'v4', text: 'Dün akşamki karışık ızgara hâlâ aklımda. Kuzu şiş yumuşacıktı, lavaş da sıcak geldi.', imageUri: IMG.ocakKarisik, createdAt: min(26 * 60), likes: 132 },
  { id: 'p12', userId: 'u2', venueId: 'v5', text: 'Kule Teras’ın yeni kokteyl menüsü: fesleğenli gin çok iyi, fiyatlar biraz yüksek.', imageUri: IMG.barKokteyl, createdAt: min(30 * 60), likes: 44 },
  // Elif'in (ben) geçmiş gecelerden paylaşımları: profilde Pinterest tipi ızgara.
  { id: 'pm1', userId: 'me', venueId: 'v6', text: 'Fasıl ekibi bu gece çok iyiydi; son şarkıda bütün meyhane eşlik etti.', imageUri: IMG.meyhaneMasa, createdAt: night(1, 95), likes: 34, tagged: ['u6'] },
  { id: 'pm2', userId: 'me', venueId: 'v5', text: 'Gün batımında terasa çıktık; DJ gelmeden önceki en güzel saat.', imageUri: IMG.barGunbatimi, createdAt: night(2, -150), likes: 51 },
  { id: 'pm3', userId: 'me', venueId: 'v7', text: 'Konser öncesi hızlı bir burger. Turşular ev yapımı, patates çıtır.', imageUri: IMG.burgerKlasik, createdAt: night(3, -60), likes: 22 },
  { id: 'pm4', userId: 'me', venueId: 'v2', text: 'Gece kahvesi ve kitap. Arka masada yine kutu oyunu turnuvası var.', imageUri: IMG.kafeFincan, createdAt: night(6, 30), likes: 18 },
  { id: 'pm5', userId: 'me', venueId: 'v8', text: 'Akustik gecede ilk kez dinlediğim bir grup; adlarını not ettim.', imageUri: IMG.sahneMikrofon, createdAt: night(9, 70), likes: 40 },
  { id: 'pm6', userId: 'me', venueId: 'v6', text: 'Çınar’da “Ben de varım” dediğim ilk plan: dokuz kişi olduk, masa iki kez uzadı.', imageUri: IMG.meyhaneSalata, createdAt: night(11, 120), likes: 27 },
  { id: 'pm7', userId: 'me', venueId: 'v3', text: 'Koşudan sonra iskelede soluklandık. Karşı kıyının ışıkları bir harika.', imageUri: IMG.sahilKizKulesi, createdAt: night(13, 80), likes: 63 },
  { id: 'pm8', userId: 'me', venueId: 'v1', text: 'Bis’te konfeti yağdı, sesimiz kısıldı.', imageUri: IMG.konserKonfeti, createdAt: night(14, 40), likes: 88, tagged: ['u1'] },
  { id: 'pm9', userId: 'me', venueId: 'v5', text: 'Fesleğenli gin’i denedim; Mert haklıymış.', imageUri: IMG.barKadeh, createdAt: night(16, 60), likes: 29 },
  // Arkadaşların, Elif'i etiketlediği paylaşımları (birlikte oldukları gecelerden): profilde "Etiketlenenler".
  { id: 'pt1', userId: 'u1', venueId: 'v5', text: 'Elif’le gün batımı nöbetindeyiz; DJ gelene kadar manzara bizim.', imageUri: IMG.barManzara, createdAt: night(2, -140), likes: 57, tagged: ['me'] },
  { id: 'pt2', userId: 'u6', venueId: 'v6', text: 'Elif nihayet favaya ikna oldu. Meze masası tam kadro.', imageUri: IMG.meyhaneTabak, createdAt: night(4, 50), likes: 41, tagged: ['me'] },
  { id: 'pt3', userId: 'u8', venueId: 'v8', text: 'Ön sıra bizimdi; Elif bütün şarkılara eşlik etti.', imageUri: IMG.sahneGrup, createdAt: night(9, 85), likes: 36, tagged: ['me'] },
  { id: 'pt4', userId: 'u7', venueId: 'v7', text: 'Konser öncesi burger turu: Elif cheddar’sız söyledi, hâlâ anlamadık.', imageUri: IMG.burgerMarul, createdAt: night(3, -50), likes: 19, tagged: ['me'] },
  { id: 'pt5', userId: 'u3', venueId: 'v3', text: 'Gece koşusu ekibi, iskelede mola. Elif tempoyu yine bozdu.', imageUri: IMG.sahilIsiklar, createdAt: night(13, 95), likes: 24, tagged: ['me'] },
  { id: 'pt6', userId: 'u1', venueId: 'v1', text: 'Bis’ten önceki an. Konfeti birazdan, Elif hazır.', imageUri: IMG.konserKalabalik, createdAt: night(14, 30), likes: 72, tagged: ['me'] },
];

/**
 * Gitmek istenen mekânlar ("To-HERE" listesi, profilde üçüncü sekme). Benimki uygulamada değişir
 * (mekân sayfasındaki kaydet düğmesi); diğerleri sabit.
 */
export const SAVED_VENUES: Record<string, string[]> = {
  me: ['v10', 'v9', 'v11', 'v12'],
  u1: ['v10', 'v9', 'v8'],
  u2: ['v11', 'v4'],
  u3: ['v12', 'v3'],
  u6: ['v11', 'v6', 'v12'],
  u7: ['v9'],
  u8: ['v10', 'v8'],
};

/**
 * Geçmiş geceler (yer bildirimleri; paylaşım olmasa da sayılır): profildeki "anı" sayısı ve anı takvimi için.
 * daysAgo 0 = bu gece. Paylaşımı olan geceler ayrıca paylaşımlardan da çıkar.
 */
const nights = (list: [number, string][]) => list.map(([daysAgo, venueId]) => ({ daysAgo, venueId }));
export const NIGHT_HISTORY: Record<string, { daysAgo: number; venueId: string }[]> = {
  me: nights([[1, 'v6'], [2, 'v5'], [3, 'v7'], [4, 'v6'], [6, 'v2'], [7, 'v6'], [8, 'v4'], [9, 'v8'], [11, 'v6'], [13, 'v3'], [14, 'v1'], [15, 'v6'], [16, 'v5'],
    [19, 'v1'], [22, 'v6'], [26, 'v5'], [29, 'v3'], [33, 'v8'], [36, 'v6'], [40, 'v2']]),
  u1: nights([[0, 'v1'], [2, 'v5'], [7, 'v6'], [9, 'v8'], [14, 'v1'], [19, 'v1'], [24, 'v8']]),
  u2: nights([[0, 'v4'], [8, 'v4'], [16, 'v5'], [20, 'v4']]),
  u3: nights([[0, 'v3'], [6, 'v2'], [13, 'v3'], [21, 'v3'], [29, 'v3']]),
  u6: nights([[0, 'v6'], [1, 'v6'], [4, 'v6'], [5, 'v4'], [11, 'v6'], [22, 'v6']]),
  u7: nights([[0, 'v7'], [3, 'v7'], [6, 'v2'], [12, 'v7']]),
  u8: nights([[0, 'v8'], [9, 'v8'], [18, 'v8'], [33, 'v8']]),
};

export const CONVERSATIONS: Conversation[] = [
  { id: 'c-v1', kind: 'venue', venueId: 'v1' },
  { id: 'c-u3', kind: 'direct', userId: 'u3', status: 'inbox' },
  { id: 'c-u5', kind: 'direct', userId: 'u5', status: 'request' },
];

export const MESSAGES: Message[] = [
  { id: 'm1', conversationId: 'c-v1', senderId: 'u2', text: 'Sahnenin sol tarafı daha rahat, oraya gelin', createdAt: min(14) },
  { id: 'm2', conversationId: 'c-v1', senderId: 'u4', text: 'Bis yapacaklar mı sizce?', createdAt: min(11) },
  { id: 'm3', conversationId: 'c-v1', senderId: 'u1', text: 'Işıklar şahane, fotoğrafları akışa attım', createdAt: min(9) },
  {
    id: 'm4', conversationId: 'c-v1', senderId: 'u3', text: 'Konserden sonra sahile yürüyelim mi?',
    plan: { emoji: '🌊', title: 'Sahile yürüyüş', time: '00:30', place: '2 numaralı kapı önü', going: 11 },
    createdAt: min(6),
  },
  { id: 'm7', conversationId: 'c-v1', senderId: 'u5', text: 'Ben de geliyorum, kapıda buluşalım', createdAt: min(3) },
  { id: 'g1', conversationId: 'c-v6', senderId: 'u9', text: 'Pencere kenarındaki uzun masadayız, iki kişilik yer var', createdAt: min(22) },
  { id: 'g2', conversationId: 'c-v6', senderId: 'u6', text: 'Favayı söyledik, deniz börülcesi de geliyor', createdAt: min(17) },
  { id: 'g3', conversationId: 'c-v6', senderId: 'u2', text: 'Fasıl ekibi 22:00’de mi başlıyor kesin?', createdAt: min(12) },
  { id: 'g4', conversationId: 'c-v6', senderId: 'u6', text: 'Evet, garson söyledi. İlk şarkı istek bizden', createdAt: min(8) },
  { id: 'g5', conversationId: 'c-v8', senderId: 'u8', text: 'Ön sıralar doldu ama bar tarafından da çok iyi duyuluyor', createdAt: min(30) },
  { id: 'g6', conversationId: 'c-v8', senderId: 'u7', text: 'Arada 15 dk mola veriyorlar, sonra ikinci set', createdAt: min(19) },
  { id: 'g7', conversationId: 'c-v8', senderId: 'u8', text: 'Setten sonra Bahariye’de yürüyelim mi?', createdAt: min(10) },
  { id: 'g8', conversationId: 'c-v3', senderId: 'u3', text: 'Koşu 23:30’da iskeleden başlıyor, tempo rahat', createdAt: min(40) },
  { id: 'g9', conversationId: 'c-v3', senderId: 'u5', text: 'Ben yürüyerek eşlik ederim, termosla çay getirdim', createdAt: min(28) },
  { id: 'm5', conversationId: 'c-u3', senderId: 'u3', text: 'Bu akşam sahilde misin?', createdAt: min(90) },
  { id: 'm6', conversationId: 'c-u5', senderId: 'u5', text: 'Selam! Kutu oyunu masasına gelir misin?', createdAt: min(20) },
];

/** Beni takip edenler (karşılıklı takibi hesaplamak için). */
export const FOLLOWS_ME = new Set(['u1', 'u3', 'u6', 'u7', 'u8', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'e10', 'e11', 'e12', 'e13', 'e14']);
/** Benim takip ettiklerim (başlangıç). */
export const I_FOLLOW = ['u1', 'u2', 'u3', 'u6', 'u7', 'u8', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e15', 'e16', 'e17', 'e18'];

/** Bilinen takip ilişkileri (ben dışındaki kişiler arasında); gerisi aşağıdaki sabit kurala göre. */
const KNOWN_FOLLOWS = new Set(['u1>u8', 'u8>u1', 'u6>u9', 'u9>u6', 'u2>u6', 'u6>u2', 'u7>u2', 'u3>u5', 'u5>u3', 'u4>e15', 'e15>u4']);

/** a, b'yi takip ediyor mu (ben dışındaki kişiler için)? Her açılışta aynı sonucu veren basit bir karma. */
export function followsBetween(a: string, b: string): boolean {
  if (KNOWN_FOLLOWS.has(`${a}>${b}`)) return true;
  let h = 7;
  for (const c of `${a}>${b}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 100 < 36;
}
