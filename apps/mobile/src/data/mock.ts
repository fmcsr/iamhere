// Prototip verisi. Backend gelene kadar uygulama tamamen bu veriyle çalışır.
// Mekân adları uydurmadır (park/meydan gibi kamusal yerler hariç).

export type Category = 'konser' | 'bar' | 'yemek' | 'kafe' | 'acik';

export type Venue = {
  id: string;
  name: string;
  category: Category;
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
];

const pic = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/1200/750`;

/** Prototipte kullanıcının (sahte) konumu: Kadıköy, Rıhtım civarı. */
export const ME_LOCATION = { latitude: 40.9897, longitude: 29.0236 };

export const VENUES: Venue[] = [
  {
    id: 'v1', name: 'Rıhtım Açıkhava', category: 'konser', distanceM: 120, here: 342, event: 'Gece Treni konseri · 21:00',
    latitude: 40.9905, longitude: 29.0225, coverUri: cover('here-rihtim'),
    nightPhotos: [pic('anlik-konser'), pic('here-sahne'), pic('here-isik'), pic('here-kalabalik'), pic('here-gitar'), pic('here-bis')],
  },
  {
    id: 'v2', name: 'Kıyı Kahvesi', category: 'kafe', distanceM: 180, here: 12,
    latitude: 40.9893, longitude: 29.0241, coverUri: cover('here-kahve'), nightPhotos: [pic('here-fincan')],
  },
  {
    id: 'v3', name: 'Moda Sahili', category: 'acik', distanceM: 260, here: 41, event: 'Gece koşusu buluşması · 23:30',
    latitude: 40.9842, longitude: 29.0262, coverUri: cover('here-moda'), nightPhotos: [pic('anlik-sahil'), pic('here-dalga')],
  },
  {
    id: 'v4', name: 'Nar Ocakbaşı', category: 'yemek', distanceM: 450, here: 27, event: '02:00’ye kadar açık',
    latitude: 40.9871, longitude: 29.0297, coverUri: cover('here-ocak'), nightPhotos: [],
  },
  {
    id: 'v5', name: 'Kule Teras', category: 'bar', distanceM: 900, here: 86, event: 'DJ seti · 22:00',
    latitude: 40.9921, longitude: 29.0318, coverUri: cover('here-teras'), nightPhotos: [pic('anlik-teras'), pic('here-dj')],
  },
];

export const POSTS: Post[] = [
  { id: 'p1', userId: 'u1', venueId: 'v1', text: 'Gece Treni ikinci bisi yaptı, sahnenin önü bambaşka bir dünya.', imageUri: pic('anlik-konser'), createdAt: min(12), likes: 48, audience: 'herkes' },
  { id: 'p2', userId: 'u4', anonAlias: 'Uykusuz Baykuş 42', venueId: 'v5', text: 'Teras doldu ama müzik çok iyi.', imageUri: pic('anlik-teras'), createdAt: min(25), likes: 21, audience: 'anonim' },
  { id: 'p3', userId: 'u2', venueId: 'v4', text: 'Ocakbaşında 4 kişilik masa boşaldı. Konserden çıkıp acıkan varsa bekleriz.', createdAt: min(41), likes: 12, audience: 'herkes' },
  { id: 'p4', userId: 'u3', venueId: 'v3', text: 'Sahilde 15 kişi olduk, 23:30’da koşuya çıkıyoruz.', imageUri: pic('anlik-sahil'), createdAt: min(55), likes: 30, audience: 'herkes' },
  { id: 'p5', userId: 'u5', venueId: 'v2', text: 'Kutu oyunu masası kuruldu, iki kişi eksiğiz.', createdAt: min(70), likes: 7, audience: 'herkes' },
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
  { id: 'm5', conversationId: 'c-u3', senderId: 'u3', text: 'Bu akşam sahilde misin?', createdAt: min(90) },
  { id: 'm6', conversationId: 'c-u5', senderId: 'u5', text: 'Selam! Kutu oyunu masasına gelir misin?', createdAt: min(20) },
];

/** Beni takip edenler (karşılıklı takibi hesaplamak için). */
export const FOLLOWS_ME = new Set(['u1', 'u3']);
/** Benim takip ettiklerim (başlangıç). */
export const I_FOLLOW = ['u1', 'u2', 'u3'];
