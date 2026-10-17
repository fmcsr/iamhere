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

export type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  interests: string[];
  followers: number;
  following: number;
  avatarColor: string;
  /** Sahte profil fotoğrafı (randomuser.me portresi); yüklenene kadar baş harf görünür. */
  avatarUri?: string;
  isPrivate?: boolean;
};

export type Audience = 'herkes' | 'takipciler' | 'anonim';

export type Post = {
  id: string;
  userId: string;
  anonAlias?: string;
  venueId: string;
  text?: string;
  imageUri?: string;
  createdAt: number;
  likes: number;
  audience: Audience;
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
  anonAlias?: string;
  text: string;
  plan?: Plan;
  createdAt: number;
};

export type Conversation =
  | { id: string; kind: 'venue'; venueId: string }
  | { id: string; kind: 'direct'; userId: string; status: 'inbox' | 'request' | 'sent' };

export const CATEGORY_LABEL: Record<Category, string> = {
  konser: 'Konser',
  bar: 'Bar',
  yemek: 'Yemek',
  kafe: 'Kafe',
  acik: 'Açık hava',
};

export const CHECK_IN_RADIUS_M = 300;

const min = (m: number) => Date.now() - m * 60_000;
const face = (id: string) => `https://randomuser.me/api/portraits/${id}.jpg`;

export const ME: User = {
  id: 'me',
  username: 'elifyilmaz',
  displayName: 'Elif Yılmaz',
  bio: 'Canlı müzik, koşu ve iyi kahve. Hafta sonları Moda.',
  interests: ['Canlı müzik', 'Kahve', 'Koşu'],
  followers: 128,
  following: 96,
  avatarColor: '#3B5BDB',
  avatarUri: face('women/44'),
};

export const USERS: User[] = [
  { id: 'u1', username: 'zeynep.k', displayName: 'Zeynep Kaya', bio: 'Konser fotoğrafçısı. Ön sıra benim.', interests: ['Canlı müzik', 'Fotoğraf'], followers: 2410, following: 310, avatarColor: '#7048E8', avatarUri: face('women/68') },
  { id: 'u2', username: 'mertdmr', displayName: 'Mert Demir', bio: 'Ocakbaşı uzmanı, meyhane müdavimi.', interests: ['Meyhane', 'Yemek'], followers: 540, following: 402, avatarColor: '#C2410C', avatarUri: face('men/32') },
  { id: 'u3', username: 'canozturk', displayName: 'Can Öztürk', bio: 'Gece yürüyüşleri ve sahil.', interests: ['Koşu', 'Açık hava'], followers: 212, following: 180, avatarColor: '#0B7285', avatarUri: face('men/75') },
  { id: 'u4', username: 'selin', displayName: 'Selin Aydın', bio: 'DJ setleri, çatı katları.', interests: ['Elektronik', 'Bar'], followers: 3890, following: 120, avatarColor: '#A61E4D', avatarUri: face('women/21'), isPrivate: true },
  { id: 'u5', username: 'arda_y', displayName: 'Arda Yıldız', bio: 'Kahve, kitap, kutu oyunları.', interests: ['Kahve', 'Kutu oyunları'], followers: 98, following: 140, avatarColor: '#2B8A3E', avatarUri: face('men/46') },
  { id: 'u6', username: 'denizarslan', displayName: 'Deniz Arslan', bio: 'Meze haritası çıkarıyorum. Fava konusunda tartışmam.', interests: ['Meyhane', 'Yemek'], followers: 1280, following: 410, avatarColor: '#5F3DC4', avatarUri: face('women/32') },
  { id: 'u7', username: 'burakkoc', displayName: 'Burak Koç', bio: 'Burger ve gece sineması.', interests: ['Yemek', 'Kahve'], followers: 640, following: 520, avatarColor: '#1864AB', avatarUri: face('men/22') },
  { id: 'u8', username: 'ece.sahin', displayName: 'Ece Şahin', bio: 'Küçük sahneler, akustik geceler.', interests: ['Canlı müzik'], followers: 905, following: 300, avatarColor: '#C92A2A', avatarUri: face('women/90') },
  { id: 'u9', username: 'kerempolat', displayName: 'Kerem Polat', bio: 'Rakı-balık ehli.', interests: ['Meyhane'], followers: 77, following: 95, avatarColor: '#5C940D', avatarUri: face('men/11') },
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
];

export const POSTS: Post[] = [
  { id: 'p1', userId: 'u1', venueId: 'v1', text: 'Gece Treni ikinci bise çıktı. Sahnenin önü bambaşka bir dünya, ses de tertemiz.', imageUri: IMG.konserTuruncu, createdAt: min(12), likes: 148, audience: 'herkes' },
  { id: 'p6', userId: 'u6', venueId: 'v6', text: 'Fava, haydari, deniz börülcesi… Meze tabağı geldi, fasıl 22:00’de başlıyor. Favayı mutlaka deneyin.', imageUri: IMG.meyhaneMeze, createdAt: min(18), likes: 89, audience: 'herkes' },
  { id: 'p2', userId: 'u4', anonAlias: 'Uykusuz Baykuş 42', venueId: 'v5', text: 'Terasta yer kalmadı ama DJ seti tam kıvamında. Manzara bedava.', imageUri: IMG.barTeras, createdAt: min(25), likes: 61, audience: 'anonim' },
  { id: 'p7', userId: 'u7', venueId: 'v7', text: 'Double smash söyledim, cheddar akıyor. Patatesler çıtır, sos ev yapımı. 15 dakikada geldi.', imageUri: IMG.burgerDouble, createdAt: min(33), likes: 54, audience: 'herkes' },
  { id: 'p3', userId: 'u2', venueId: 'v4', text: 'Acılı Adana efsane, yanına közlenmiş biber şart. 4 kişilik masa boşaldı, konserden çıkıp acıkan varsa bekleriz.', imageUri: IMG.ocakAdana, createdAt: min(41), likes: 37, audience: 'herkes' },
  { id: 'p8', userId: 'u8', venueId: 'v8', text: 'Akustik gece başladı. Salon küçük ama ses harika, ön sıralar dolmak üzere.', imageUri: IMG.sahneSolist, createdAt: min(47), likes: 76, audience: 'herkes' },
  { id: 'p4', userId: 'u3', venueId: 'v3', text: 'Sahilde 15 kişi olduk, 23:30’da koşuya çıkıyoruz. Hava serin, rüzgârlık alın.', imageUri: IMG.sahilBank, createdAt: min(55), likes: 30, audience: 'herkes' },
  { id: 'p10', userId: 'u9', venueId: 'v6', text: 'Çınar’da rakı-balık masası kurduk, iki kişi daha sığar. Fasıl başlamadan gelin.', createdAt: min(64), likes: 18, audience: 'herkes' },
  { id: 'p5', userId: 'u5', venueId: 'v2', text: 'Flat white’ları hâlâ Kadıköy’ün en iyisi. Arka masada kutu oyunu kuruldu, iki kişi eksiğiz.', imageUri: IMG.kafeLatte, createdAt: min(70), likes: 22, audience: 'herkes' },
  { id: 'p9', userId: 'u1', venueId: 'v1', text: 'Kapılar açıldı, ışık provası yapılıyor. Erken gelen sahnenin sol tarafını kapsın.', imageUri: IMG.konserIsik, createdAt: min(150), likes: 95, audience: 'herkes' },
  { id: 'p13', userId: 'u7', venueId: 'v2', text: 'Akşam kahvesi molası: dört fincan, dört farklı desen. Barista bugün formunda.', imageUri: IMG.kafeDortFincan, createdAt: min(190), likes: 27, audience: 'herkes' },
  { id: 'p11', userId: 'u6', venueId: 'v4', text: 'Dün akşamki karışık ızgara hâlâ aklımda. Kuzu şiş yumuşacıktı, lavaş da sıcak geldi.', imageUri: IMG.ocakKarisik, createdAt: min(26 * 60), likes: 132, audience: 'herkes' },
  { id: 'p12', userId: 'u2', venueId: 'v5', text: 'Kule Teras’ın yeni kokteyl menüsü: fesleğenli gin çok iyi, fiyatlar biraz yüksek.', imageUri: IMG.barKokteyl, createdAt: min(30 * 60), likes: 44, audience: 'herkes' },
];

export const CONVERSATIONS: Conversation[] = [
  { id: 'c-v1', kind: 'venue', venueId: 'v1' },
  { id: 'c-u3', kind: 'direct', userId: 'u3', status: 'inbox' },
  { id: 'c-u5', kind: 'direct', userId: 'u5', status: 'request' },
];

export const MESSAGES: Message[] = [
  { id: 'm1', conversationId: 'c-v1', senderId: 'u2', text: 'Sahnenin sol tarafı daha rahat, oraya gelin', createdAt: min(14) },
  { id: 'm2', conversationId: 'c-v1', senderId: 'u4', anonAlias: 'Sessiz Tilki 58', text: 'Bis yapacaklar mı sizce?', createdAt: min(11) },
  { id: 'm3', conversationId: 'c-v1', senderId: 'u1', text: 'Işıklar şahane, fotoğrafları akışa attım', createdAt: min(9) },
  {
    id: 'm4', conversationId: 'c-v1', senderId: 'u3', text: 'Konserden sonra sahile yürüyelim mi?',
    plan: { emoji: '🌊', title: 'Sahile yürüyüş', time: '00:30', place: '2 numaralı kapı önü', going: 11 },
    createdAt: min(6),
  },
  { id: 'm7', conversationId: 'c-v1', senderId: 'u5', text: 'Ben de geliyorum, kapıda buluşalım', createdAt: min(3) },
  { id: 'g1', conversationId: 'c-v6', senderId: 'u9', text: 'Pencere kenarındaki uzun masadayız, iki kişilik yer var', createdAt: min(22) },
  { id: 'g2', conversationId: 'c-v6', senderId: 'u6', text: 'Favayı söyledik, deniz börülcesi de geliyor', createdAt: min(17) },
  { id: 'g3', conversationId: 'c-v6', senderId: 'u2', anonAlias: 'Neşeli Martı 7', text: 'Fasıl ekibi 22:00’de mi başlıyor kesin?', createdAt: min(12) },
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
export const FOLLOWS_ME = new Set(['u1', 'u3', 'u6', 'u7', 'u8']);
/** Benim takip ettiklerim (başlangıç). */
export const I_FOLLOW = ['u1', 'u2', 'u3', 'u6', 'u7', 'u8'];
