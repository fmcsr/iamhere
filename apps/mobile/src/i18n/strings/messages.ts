import type { Audience } from '@/data/mock';

/** Mesajlar, istekler, yeni mesaj, sohbetler (mekân sohbeti, DM, plan kartı) ve eski paylaşım ekranı (T-29). */
export const tr = {
  /** Mesajlar sekmesi: grup sohbetleri, sohbet listesi, öneriler. */
  inbox: {
    search: 'Ara',
    groupChats: 'Grup sohbetleri',
    requestsA11y: (n: number) => `İstekler, ${n}`,
    noMatch: (query: string) => `“${query}” ile eşleşen sohbet yok.`,
    suggested: 'Önerilenler',
    tapToMessage: 'Mesaj göndermek için dokun',
    resetsIn: (remaining: string) => `Sohbetler ${remaining} sonra sıfırlanır`,
    /** Son mesajı sen yazdıysan satırda "Sen: …". */
    you: 'Sen',
    venueChatA11y: (venue: string, locked: boolean) => `${venue} sohbeti${locked ? ', kilitli' : ''}`,
    lockedPreview: 'Katılmak için orada olduğunu bildir',
    personA11y: (name: string, unread: boolean) => `${name}${unread ? ', okunmamış' : ''}`,
    requestSent: 'İstek gönderildi · kabul edilmesini bekliyor',
    noMessages: 'Henüz mesaj yok',
    unread: 'Okunmamış',
  },
  /** Mesaj istekleri (K-08). Sil / Kabul et sohbetteki istek panelinde de kullanılır. */
  requests: {
    title: 'İstekler',
    intro:
      'Karşılıklı takipleşmediğin kişilerin ilk mesajı buraya düşer. Kabul edersen sohbet gelen kutuna taşınır; silersen karşı taraf bunu bilmez. Kabul etmediğin istekler 04:00’te silinir.',
    followsYou: 'Seni takip ediyor',
    notMutual: 'Takipleşmiyorsunuz',
    delete: 'Sil',
    accept: 'Kabul et',
    emptyTitle: 'Bekleyen istek yok',
    emptyNote: 'Yeni bir istek geldiğinde Mesajlar simgesinin köşesinde küçük bir nokta görürsün.',
  },
  newMessage: {
    to: 'Kime:',
    toA11y: 'Kime',
    search: 'Ara',
    mutuals: 'Takipleştiklerin',
    others: 'Diğer kişiler',
    othersNote: 'Mesajın istek olarak gider.',
    noMatch: (query: string) => `“${query}” adında kimse yok.`,
  },
  chat: {
    notFound: 'Sohbet bulunamadı.',
    /** Başlığın erişilebilirlik etiketi; `here` mekân sohbetinde "342 kişi burada". */
    titleA11y: (title: string, remaining: string, here?: string) =>
      `${title}. ${here ? `${here}. ` : ''}Sohbetin sıfırlanmasına ${remaining} kaldı`,
    venueInfo: 'Mekân bilgisi',
    openProfile: 'Profili aç',
    /** Yer bildirmeden açılan mekân sohbeti (K-17). */
    locked: {
      title: 'Sohbet kilitli',
      checkInOnly: 'Bu sohbet yalnızca mekânda yer bildirenlere açık.',
      tooFar: (distance: string) =>
        `Bu sohbete katılmak için mekânda olmalısın. Şu an ${distance} uzaktasın; yer bildirimi yalnızca 300 m içinde yapılabilir.`,
      /** `people`: "342 kişi". */
      stats: (people: string, messages: number, plans: number) => `${people} · ${messages} mesaj${plans ? ` · ${plans} aktif plan` : ''}`,
      checkInAndJoin: 'Yer bildir ve katıl',
      mustBeThere: 'Mekânda olmalısın',
    },
    /** Takma adla yazdığın mesajın üstünde. */
    asAlias: (alias: string) => `${alias} olarak`,
    reportHint: 'Bildirmek veya engellemek için basılı tut',
    incomingRequest: (name: string) => `${name} sana mesaj isteği gönderdi. Kabul etmeden yanıt yazamazsın.`,
    waitingAccept: (name: string) => `İsteğin gönderildi. ${name} kabul edene kadar yeni mesaj yazamazsın.`,
    /** "+" düğmesi: plan, fotoğraf, buluşma noktası. */
    attach: {
      a11y: 'Ekle: plan, fotoğraf, buluşma noktası',
      title: 'Ekle',
      photo: 'Fotoğraf',
      meetingPoint: 'Buluşma noktası',
      notYet: 'Prototipte henüz yok.',
    },
    placeholder: 'Mesaj',
    placeholderAs: (alias: string) => `${alias} olarak yaz…`,
    inputA11y: 'Mesaj yaz',
    send: 'Gönder',
    venueNote: 'Bu sohbet her gece 04:00’te sıfırlanır. Yalnızca burada yer bildirenler katılabilir.',
    directNote: (username: string) => `@${username} ile birebir sohbet · her gece 04:00’te sıfırlanır.`,
  },
  /** Plan oluşturma ve plan kartı. */
  plan: {
    venueOnly: 'Planlar mekân sohbetlerinde paylaşılır.',
    newTitle: 'Yeni plan',
    newPrompt: 'Ne yapıyoruz? Saat en geç 04:00 olabilir.',
    /** Android'de soru penceresi yok; plan bu adla açılır. */
    defaultTitle: 'Buluşalım',
    /** `author` boşsa planı sen paylaştın ("Sen bir plan paylaştı" yanlıştı). */
    shared: (author: string | null, time: string) => (author ? `${author} bir plan paylaştı · ${time}` : `Bir plan paylaştın · ${time}`),
    /** `people`: "3 kişi". */
    going: (people: string) => `${people} katılıyor`,
    beFirst: 'İlk katılan sen ol',
    join: 'Ben de varım',
    joined: 'Varsın',
  },
  /** Eski paylaşım ekranı (derin bağlantıyla hâlâ açılıyor). */
  compose: {
    notFound: 'Mekân bulunamadı.',
    change: 'Değiştir',
    changeVenueA11y: 'Mekânı değiştir',
    tooFar: (distance: string) =>
      `Bu mekâna ${distance} uzaktasın. Yer bildirmek ve sohbete katılmak için mekânda (300 m içinde) olmalısın.`,
    selectedPhoto: 'Seçilen fotoğraf',
    removePhoto: 'Fotoğrafı kaldır',
    addPhoto: 'Fotoğraf ekle',
    addPhotoA11y: 'Fotoğraf ekle, isteğe bağlı',
    optional: 'İsteğe bağlı',
    placeholder: 'Neler oluyor? (isteğe bağlı)',
    textA11y: 'Yorum',
    whoCanSee: 'Kim görebilir',
    audience: { herkes: 'Herkes', takipciler: 'Takipçilerim', anonim: 'Anonim' } as Record<Audience, string>,
    audienceNote: {
      herkes: 'Paylaşımın yakındakilerin akışında ve mekân sayfasında görünür.',
      takipciler: 'Yalnızca seni takip edenler görür.',
      anonim: 'Adın ve profilin gizli kalır; mekân görünür. Bu gece “Gezgin Martı 17” olarak görünürsün.',
    } as Record<Audience, string>,
    joinChat: 'Mekân sohbetine katıl',
    mustBeThere: 'Mekânda olmalısın',
    shareAndJoin: 'Paylaş ve katıl',
    checkIn: 'Buradayım',
  },
};

/** İngilizcede sayı ve tekil/çoğul ad: "1 message", "3 messages". */
const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const en: typeof tr = {
  inbox: {
    search: 'Search',
    groupChats: 'Group chats',
    requestsA11y: (n: number) => `Requests, ${n}`,
    noMatch: (query: string) => `No chats match “${query}”.`,
    suggested: 'Suggested',
    tapToMessage: 'Tap to send a message',
    resetsIn: (remaining: string) => `Chats reset in ${remaining}`,
    you: 'You',
    venueChatA11y: (venue: string, locked: boolean) => `${venue} chat${locked ? ', locked' : ''}`,
    lockedPreview: 'Check in to join',
    personA11y: (name: string, unread: boolean) => `${name}${unread ? ', unread' : ''}`,
    requestSent: 'Request sent · waiting for them to accept',
    noMessages: 'No messages yet',
    unread: 'Unread',
  },
  requests: {
    title: 'Requests',
    intro:
      'First messages from people you don’t follow mutually land here. If you accept, the chat moves to your inbox; if you delete it, they won’t know. Requests you don’t accept are deleted at 04:00.',
    followsYou: 'Follows you',
    notMutual: 'You don’t follow each other',
    delete: 'Delete',
    accept: 'Accept',
    emptyTitle: 'No pending requests',
    emptyNote: 'When a new request comes in, you’ll see a small dot on the corner of the Messages icon.',
  },
  newMessage: {
    to: 'To:',
    toA11y: 'To',
    search: 'Search',
    mutuals: 'Mutual follows',
    others: 'Other people',
    othersNote: 'Your message will be sent as a request.',
    noMatch: (query: string) => `No one named “${query}”.`,
  },
  chat: {
    notFound: 'Chat not found.',
    titleA11y: (title: string, remaining: string, here?: string) => `${title}. ${here ? `${here}. ` : ''}Chat resets in ${remaining}`,
    venueInfo: 'Venue info',
    openProfile: 'Open profile',
    locked: {
      title: 'Chat locked',
      checkInOnly: 'This chat is only open to people checked in at the venue.',
      tooFar: (distance: string) => `You need to be at the venue to join this chat. You’re ${distance} away; you can only check in within 300 m.`,
      stats: (people: string, messages: number, plans: number) =>
        `${people} · ${count(messages, 'message')}${plans ? ` · ${count(plans, 'active plan')}` : ''}`,
      checkInAndJoin: 'Check in and join',
      mustBeThere: 'You need to be there',
    },
    asAlias: (alias: string) => `as ${alias}`,
    reportHint: 'Touch and hold to report or block',
    incomingRequest: (name: string) => `${name} sent you a message request. You can’t reply until you accept.`,
    waitingAccept: (name: string) => `Request sent. You can’t send more messages until ${name} accepts.`,
    attach: {
      a11y: 'Add a plan, photo or meeting point',
      title: 'Add',
      photo: 'Photo',
      meetingPoint: 'Meeting point',
      notYet: 'Not in the prototype yet.',
    },
    placeholder: 'Message',
    placeholderAs: (alias: string) => `Write as ${alias}…`,
    inputA11y: 'Write a message',
    send: 'Send',
    venueNote: 'This chat resets every night at 04:00. Only people checked in here can join.',
    directNote: (username: string) => `One-on-one chat with @${username} · resets every night at 04:00.`,
  },
  plan: {
    venueOnly: 'Plans are shared in venue chats.',
    newTitle: 'New plan',
    newPrompt: 'What are we doing? The time can be no later than 04:00.',
    defaultTitle: 'Let’s meet up',
    shared: (author: string | null, time: string) => (author ? `${author} shared a plan · ${time}` : `You shared a plan · ${time}`),
    going: (people: string) => `${people} going`,
    beFirst: 'Be the first to join',
    join: 'I’m in',
    joined: 'You’re in',
  },
  compose: {
    notFound: 'Venue not found.',
    change: 'Change',
    changeVenueA11y: 'Change venue',
    tooFar: (distance: string) => `You’re ${distance} from this venue. To check in and join the chat, you need to be there (within 300 m).`,
    selectedPhoto: 'Selected photo',
    removePhoto: 'Remove photo',
    addPhoto: 'Add photo',
    addPhotoA11y: 'Add photo, optional',
    optional: 'Optional',
    placeholder: 'What’s happening? (optional)',
    textA11y: 'Comment',
    whoCanSee: 'Who can see this',
    audience: { herkes: 'Everyone', takipciler: 'Followers', anonim: 'Anonymous' },
    audienceNote: {
      herkes: 'Your post appears in nearby people’s feeds and on the venue page.',
      takipciler: 'Only people who follow you see it.',
      anonim: 'Your name and profile stay hidden; the venue is visible. Tonight you’ll appear as “Wandering Seagull 17”.',
    },
    joinChat: 'Join the venue chat',
    mustBeThere: 'You need to be there',
    shareAndJoin: 'Share and join',
    checkIn: 'I’m here',
  },
};
