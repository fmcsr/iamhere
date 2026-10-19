/** Ana sayfa, Keşfet, Buradayım, yer bildirme sayfası, mekân sayfası ve "burada kimler var" (T-29). */
export const tr = {
  /** Birden çok ekranda geçenler. */
  checkIn: 'Yer bildir',
  directions: 'Yol tarifi',
  liveNow: 'Şu an canlı',
  /** Ana sayfa akışı. */
  feed: {
    me: 'Sen',
    meAt: (venue: string) => `Sen, ${venue}`,
    friendAt: (name: string, venue: string) => `${name}, şu an ${venue}`,
    onMap: 'Haritada',
    tonight: 'Bu gece',
    forYou: 'Sana özel',
    nearby: 'Çevrende',
    end: 'Şimdilik bu kadar.',
  },
  /** Keşfet haritası. */
  explore: {
    liveVenues: (n: number) => `${n} canlı mekân`,
  },
  /** Buradayım sekmesi. */
  checkin: {
    search: 'Mekân ara',
    current: 'Şu an buradasın',
    goToChat: 'Mekân sohbetine git',
    privacy: 'Tam konumun kimseyle paylaşılmaz. Diğerleri yalnızca seçtiğin mekânı görür.',
    nearby: 'Yakındaki mekânlar',
    mustBeThere: 'Mekânda olmalısın',
    empty: (query: string) => `“${query}” için yakında mekân yok.`,
    note: (radius: number) =>
      `Yer bildirmek için mekâna ${radius} m’den yakın olmalısın; böylece sohbetlerde gerçekten orada olanlar buluşur. Prototipte konum sahte, mekânlar Kadıköy’de.`,
  },
  /** Alttan açılan yer bildirme sayfası ve iğneli kaydırıcı. */
  sheet: {
    cameraTitle: 'Kamera izni gerekli',
    cameraMessage: 'Fotoğraf çekmek için Ayarlar › HERE › Kamera iznini aç.',
    /** iOS'un Ayarlar uygulamasını açan düğme. */
    openSettings: 'Ayarlar',
    takePhoto: 'Fotoğraf çek (isteğe bağlı)',
    retakePhoto: 'Fotoğrafı yeniden çek',
    removePhoto: 'Fotoğrafı kaldır',
    tooFar: (radius: number, distance: string) => `${radius} m içinde değilsin · ${distance} uzaktasın`,
    slide: 'Yer bildir: iğneyi aşağı kaydır',
    locked: 'Yer bildirme kapalı: mekân çok uzakta',
  },
  /** Mekân sayfası. */
  venue: {
    notFound: 'Mekân bulunamadı.',
    save: 'To-HERE listene ekle',
    unsave: 'To-HERE listenden çıkar',
    share: 'Mekânı paylaş',
    shareMessage: (venue: string) => `Bu gece buradayız: ${venue} · HERE #iamhere`,
    cover: (venue: string) => `${venue} kapak fotoğrafı`,
    event: (event: string) => `Bu gece: ${event}`,
    openPeople: (n: number) => `${n} kişi şu an burada. Listeyi aç`,
    photos: 'Fotoğraflar',
    photo: 'Mekândan fotoğraf',
    chat: 'Mekân sohbeti',
    lastMessage: (ago: string) => `son mesaj ${ago}`,
    plans: (n: number) => `${n} aktif plan`,
    chatLocked: 'Sohbet kilitli',
    chatLockedNote: 'Yalnızca burada yer bildirenlere açık',
    noPosts: 'Henüz paylaşım yok.',
  },
  /** "Burada kimler var" sayfası. */
  people: {
    title: 'Burada kimler var',
    following: 'takip ediyorsun',
    others: (n: number) => `ve ${n} kişi daha. Anonim olanlar ve görünürlüğünü kapatanlar listelenmez.`,
  },
};

/** İngilizcede tekil/çoğul: "1 live venue" · "2 live venues". */
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const en: typeof tr = {
  checkIn: 'Check in',
  directions: 'Directions',
  liveNow: 'Live now',
  feed: {
    me: 'You',
    meAt: (venue: string) => `You, at ${venue}`,
    friendAt: (name: string, venue: string) => `${name}, now at ${venue}`,
    onMap: 'View map',
    tonight: 'Tonight',
    forYou: 'For you',
    nearby: 'Nearby',
    end: 'That’s all for now.',
  },
  explore: {
    liveVenues: (n: number) => plural(n, 'live venue', 'live venues'),
  },
  checkin: {
    search: 'Search venues',
    current: 'You’re here now',
    goToChat: 'Go to venue chat',
    privacy: 'Your exact location is never shared. Others only see the venue you choose.',
    nearby: 'Nearby venues',
    mustBeThere: 'You need to be there',
    empty: (query: string) => `No nearby venues match “${query}”.`,
    note: (radius: number) =>
      `You need to be within ${radius} m of a venue to check in, so everyone in its chat is really there. The prototype uses a simulated location; the venues are in Kadıköy.`,
  },
  sheet: {
    cameraTitle: 'Camera access needed',
    cameraMessage: 'To take a photo, turn on Camera in Settings › HERE.',
    openSettings: 'Settings',
    takePhoto: 'Take a photo (optional)',
    retakePhoto: 'Retake photo',
    removePhoto: 'Remove photo',
    tooFar: (radius: number, distance: string) => `You’re not within ${radius} m · ${distance} away`,
    slide: 'Check in: slide the pin down',
    locked: 'Check-in unavailable: the venue is too far away',
  },
  venue: {
    notFound: 'Venue not found.',
    save: 'Add to your To-HERE list',
    unsave: 'Remove from your To-HERE list',
    share: 'Share venue',
    shareMessage: (venue: string) => `We’re here tonight: ${venue} · HERE #iamhere`,
    cover: (venue: string) => `Cover photo of ${venue}`,
    event: (event: string) => `Tonight: ${event}`,
    openPeople: (n: number) => `${plural(n, 'person', 'people')} here now. Open the list`,
    photos: 'Photos',
    photo: 'Photo from the venue',
    chat: 'Venue chat',
    lastMessage: (ago: string) => `last message ${ago}`,
    plans: (n: number) => plural(n, 'active plan', 'active plans'),
    chatLocked: 'Chat locked',
    chatLockedNote: 'Open only to people who check in here',
    noPosts: 'No posts yet.',
  },
  people: {
    title: 'Who’s here',
    following: 'following',
    others: (n: number) => `and ${plural(n, 'more person', 'more people')}. Anyone anonymous or with visibility turned off isn’t listed.`,
  },
};
