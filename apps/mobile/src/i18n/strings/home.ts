/** Ana sayfa, Keşfet, Buradayım, yer bildirme sayfası, mekân sayfası ve "burada kimler var" (T-29). */
export const tr = {
  /** Birden çok ekranda geçenler. */
  checkIn: 'Yer bildir',
  directions: 'Yol tarifi',
  /** Uzaktaki mekânda tek düğme (S5): "Yol tarifi · 2 km". */
  directionsTo: (distance: string) => `Yol tarifi · ${distance}`,
  liveNow: 'Şu an canlı',
  /** Başka mekânda yer bildirmişken yenisine geçerken onay (K-06). Mekân adlarına ek gelmez (ünlü uyumu ve iyelikli adlar). */
  switchVenue: {
    title: 'Yeni mekâna geçiyorsun',
    message: (from: string, to: string) => `${from} → ${to}\n\nÖnceki mekânın sohbetini 04:00’e kadar okuyabilirsin ama yazamazsın.`,
    confirm: 'Devam et',
  },
  /** Yer bildirdikten 3 saat sonra yerel bildirim (K-06). Mekân adına ek gelmez. */
  stillHere: {
    title: 'Hâlâ orada mısın?',
    body: (venue: string) => `${venue} · Yer bildireli 3 saat oldu.`,
    yes: 'Evet, buradayım',
  },
  /** "Ayrıldım" (K-06). */
  leave: {
    button: 'Ayrıldım',
    title: 'Ayrıldın mı?',
    message: (venue: string) => `${venue} sohbetini 04:00’e kadar okuyabilirsin ama yazamazsın. Geri dönersen yeniden yer bildirerek yazarsın.`,
  },
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
    /** Fotoğrafın altına isteğe bağlı yazı (en fazla 150 harf, S3). */
    caption: 'Bir şey yaz (isteğe bağlı)',
    captionA11y: 'Fotoğrafın altına yazı, en fazla 150 harf',
    /** "Kimlerle?" etiketi (S3): bu gece burada olan, karşılıklı takipleştiğin kişiler. */
    withWhom: 'Kimlerle?',
    withWhomEmpty: 'Bu gece burada karşılıklı takipleştiğin kimse görünmüyor.',
    tag: (name: string) => `${name} etiketle`,
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
    others: (n: number) => `ve ${n} kişi daha. “Şu an burada kimler görsün” ayarı sana izin vermeyenler listelenmez.`,
  },
};

/** İngilizcede tekil/çoğul: "1 live venue" · "2 live venues". */
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const en: typeof tr = {
  checkIn: 'Check in',
  directions: 'Directions',
  directionsTo: (distance: string) => `Directions · ${distance}`,
  switchVenue: {
    title: 'Switching venues',
    message: (from: string, to: string) => `${from} → ${to}\n\nYou can keep reading the previous venue’s chat until 04:00 but can’t write there.`,
    confirm: 'Continue',
  },
  stillHere: {
    title: 'Still there?',
    body: (venue: string) => `${venue} · You checked in 3 hours ago.`,
    yes: 'Yes, I’m here',
  },
  leave: {
    button: 'I left',
    title: 'Did you leave?',
    message: (venue: string) => `You can read the ${venue} chat until 04:00 but can’t write. If you come back, check in again to write.`,
  },
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
    caption: 'Write something (optional)',
    captionA11y: 'Caption under the photo, up to 150 characters',
    withWhom: 'Who with?',
    withWhomEmpty: 'None of your mutual follows are here tonight.',
    tag: (name: string) => `Tag ${name}`,
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
    others: (n: number) => `and ${plural(n, 'more person', 'more people')}. People whose “Who sees where you are” setting doesn’t include you aren’t listed.`,
  },
};
