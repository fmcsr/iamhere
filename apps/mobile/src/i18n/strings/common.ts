import type { Category } from '@/data/mock';

/**
 * Ortak metinler (T-29): sekmeler, sayfa başlıkları, kategoriler, zaman ve tarih, ortak bileşenler
 * (paylaşım kartı, mekân kartı, yer bildirme aksesuarı, güvenlik menüsü). Türkçe kaynak; İngilizce aynı biçimde.
 */
export const tr = {
  /** Sözlüğün dili (dile göre dallanan yardımcılar için). */
  lang: 'tr' as 'tr' | 'en',
  tabs: { home: 'Ana Sayfa', explore: 'Keşfet', checkin: 'Buradayım', messages: 'Mesajlar', profile: 'Profil' },
  titles: {
    chat: 'Sohbet',
    settings: 'Ayarlar',
    editProfile: 'Profili düzenle',
    newMessage: 'Yeni mesaj',
    posts: 'Paylaşımlar',
    memories: 'Anılar',
  },
  categories: { konser: 'Konser', bar: 'Bar', yemek: 'Yemek', kafe: 'Kafe', acik: 'Açık hava' } as Record<Category, string>,
  /** İlgi alanları Türkçe adlarıyla saklanır; ekranda bu adla görünür. */
  interest: (name: string) => name,
  people: (n: number) => `${n} kişi`,
  /** Canlı sayaç metinleri ("● 342 kişi burada"). */
  live: {
    here: (n: number) => `${n} kişi burada`,
    hereNow: (n: number) => `${n} kişi şu an burada`,
    inChat: (n: number) => `${n} kişi sohbette`,
    short: (n: number) => `${n} burada`,
  },
  time: {
    now: 'şimdi',
    minutes: (m: number) => `${m} dk`,
    hours: (h: number) => `${h} sa`,
    yesterday: 'dün',
    days: (d: number) => `${d} g`,
    /** 04:00'e kalan süre. */
    remaining: (h: number, m: number) => (h > 0 ? `${h} sa ${m} dk` : `${m} dk`),
  },
  date: {
    months: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    weekdays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
    weekdaysShort: ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'],
    /** "Cuma, 16 Ekim" */
    long: (weekday: string, day: number, month: string) => `${weekday}, ${day} ${month}`,
  },
  /** Ondalık ayırıcı: "1,8 km". */
  decimal: ',',
  and: 've',
  actions: { cancel: 'Vazgeç', share: 'Paylaş', back: 'Geri', close: 'Kapat', clearSearch: 'Aramayı temizle', more: 'Diğer seçenekler' },
  safety: { report: 'Bildir', block: 'Engelle', mute: 'Sessize al', notSaved: 'Prototipte bu işlem henüz kaydedilmiyor.' },
  /** Paylaşım kartı (akış ve profil). */
  card: {
    withYou: 'Seninle',
    withYouAnd: (names: string) => `Seninle ve ${names} ile`,
    withNames: (names: string) => `${names} ile`,
    doubleTapToLike: 'Beğenmek için iki kez dokun',
    photoAt: (venue: string) => `${venue} fotoğrafı`,
    like: (count: number) => `Beğen, ${count}`,
    goToChat: 'Sohbete git',
    venue: 'Mekân',
    /** ••• menüsü (S3): kendi paylaşımını silersin, etiketlendiğin paylaşımdan etiketini kaldırırsın. */
    delete: 'Paylaşımı sil',
    deleteConfirm: 'Paylaşım silinsin mi?',
    deleteNote: 'Fotoğraf ve yazı profilinden ve akıştan kalkar. Bu geri alınamaz.',
    removeTag: 'Etiketimi kaldır',
  },
  /** Mekân kartı ve satırları. */
  venueCard: {
    a11y: (name: string, category: string, distance: string, here: number) => `${name}, ${category}, ${distance}, ${here} kişi burada`,
    friendsThere: (first: string, more: number) => (more > 0 ? `${first} ve ${more} kişi daha orada` : `${first} orada`),
  },
  /** Yer bildirmişken sekme çubuğunun üstündeki cam aksesuar. */
  accessory: {
    a11y: (venue: string, here: number, remaining: string) =>
      `${venue} sohbetini aç. ${here} kişi burada, sohbetin sıfırlanmasına ${remaining} kaldı`,
  },
  map: { you: 'Konumun', recenter: 'Konumuma dön' },
  plan: 'Plan',
};

const INTERESTS_EN: Record<string, string> = {
  'Canlı müzik': 'Live music',
  Elektronik: 'Electronic',
  Caz: 'Jazz',
  Dans: 'Dancing',
  Bar: 'Bars',
  Kokteyl: 'Cocktails',
  Şarap: 'Wine',
  Meyhane: 'Meyhane',
  Yemek: 'Food',
  'Sokak lezzetleri': 'Street food',
  Kahve: 'Coffee',
  'Kutu oyunları': 'Board games',
  'Stand-up': 'Stand-up',
  Tiyatro: 'Theatre',
  Sinema: 'Cinema',
  Fotoğraf: 'Photography',
  Kitap: 'Books',
  Koşu: 'Running',
  'Açık hava': 'Outdoors',
  Sahil: 'Seaside',
};

export const en: typeof tr = {
  lang: 'en',
  tabs: { home: 'Home', explore: 'Explore', checkin: 'Here', messages: 'Messages', profile: 'Profile' },
  titles: {
    chat: 'Chat',
    settings: 'Settings',
    editProfile: 'Edit profile',
    newMessage: 'New message',
    posts: 'Posts',
    memories: 'Memories',
  },
  categories: { konser: 'Concert', bar: 'Bar', yemek: 'Food', kafe: 'Café', acik: 'Outdoors' },
  interest: (name: string) => INTERESTS_EN[name] ?? name,
  people: (n: number) => (n === 1 ? '1 person' : `${n} people`),
  live: {
    here: (n: number) => `${n === 1 ? '1 person' : `${n} people`} here`,
    hereNow: (n: number) => `${n === 1 ? '1 person' : `${n} people`} here now`,
    inChat: (n: number) => `${n === 1 ? '1 person' : `${n} people`} in the chat`,
    short: (n: number) => `${n} here`,
  },
  time: {
    now: 'now',
    minutes: (m: number) => `${m}m`,
    hours: (h: number) => `${h}h`,
    yesterday: 'yesterday',
    days: (d: number) => `${d}d`,
    remaining: (h: number, m: number) => (h > 0 ? `${h}h ${m}m` : `${m}m`),
  },
  date: {
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    weekdaysShort: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    long: (weekday: string, day: number, month: string) => `${weekday}, ${month} ${day}`,
  },
  decimal: '.',
  and: 'and',
  actions: { cancel: 'Cancel', share: 'Share', back: 'Back', close: 'Close', clearSearch: 'Clear search', more: 'More options' },
  safety: { report: 'Report', block: 'Block', mute: 'Mute', notSaved: 'The prototype doesn’t save this yet.' },
  card: {
    withYou: 'With you',
    withYouAnd: (names: string) => `With you and ${names}`,
    withNames: (names: string) => `With ${names}`,
    doubleTapToLike: 'Double-tap to like',
    photoAt: (venue: string) => `Photo at ${venue}`,
    like: (count: number) => `Like, ${count}`,
    goToChat: 'Go to chat',
    venue: 'Venue',
    delete: 'Delete post',
    deleteConfirm: 'Delete this post?',
    deleteNote: 'The photo and caption disappear from your profile and the feed. This can’t be undone.',
    removeTag: 'Remove my tag',
  },
  venueCard: {
    a11y: (name: string, category: string, distance: string, here: number) =>
      `${name}, ${category}, ${distance}, ${here === 1 ? '1 person' : `${here} people`} here`,
    friendsThere: (first: string, more: number) => (more > 0 ? `${first} and ${more} more are there` : `${first} is there`),
  },
  accessory: {
    a11y: (venue: string, here: number, remaining: string) =>
      `Open the ${venue} chat. ${here === 1 ? '1 person' : `${here} people`} here, chat resets in ${remaining}`,
  },
  map: { you: 'Your location', recenter: 'Back to my location' },
  plan: 'Plan',
};
