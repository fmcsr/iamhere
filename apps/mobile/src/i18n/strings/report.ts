import type { ReportReason } from '@/data/store';

/** Bildir ve Ayarlar › Ekibe bildir. Bildirilen kişi bildirimi öğrenmez; acil durumda 112. */
export const tr = {
  title: 'Bildir',
  titleGeneral: 'Ekibe bildir',
  generalIntro:
    'Rahatsız edildiysen ya da bir şey ters gittiyse anlat. Engellediğin biri başka bir hesaptan ya da başka bir yoldan rahatsız etmeye devam ediyorsa da buradan bildir.',
  usernamePlaceholder: 'İlgili kişi (isteğe bağlı): @kullanıcıadı',
  usernameA11y: 'İlgili kişinin kullanıcı adı, isteğe bağlı',
  /** Neyin bildirildiği. */
  kind: { user: 'Profil', post: 'Paylaşım', message: 'Mesaj' },
  why: 'Neden bildiriyorsun?',
  reasons: {
    taciz: 'Taciz ya da sürekli rahatsız etme',
    tehdit: 'Tehdit ya da şiddet',
    cinsel: 'İstenmeyen cinsel içerik ya da mesaj',
    nefret: 'Nefret söylemi ya da ayrımcılık',
    spam: 'Spam ya da dolandırıcılık',
    sahte: 'Sahte hesap ya da başkasını taklit',
    yas: '18 yaşından küçük olabilir',
    diger: 'Başka bir şey',
  } as Record<ReportReason, string>,
  notePlaceholder: 'Ne oldu? (isteğe bağlı)',
  notePlaceholderRequired: 'Ne oldu? Kim, nerede, ne zaman: kısaca anlat.',
  noteA11y: 'Ne olduğunu anlat',
  alsoBlock: (name: string) => `${name} engelle`,
  alsoBlockNote: 'Birbirinizi göremez, birbirinize yazamazsınız.',
  privateNote: 'Bildirimin gizli kalır: bildirdiğin kişi bunu öğrenmez. Bildirilen mesaj 04:00’te silinse de ekip görebilir.',
  emergency: 'Acil bir tehlike varsa hemen 112’yi ara.',
  send: 'Gönder',
  sentTitle: 'Bildirimin ekibimize ulaştı',
  sentNote: 'İnceleyip gerekirse hesabı kapatırız. Teşekkürler; uygulamayı herkes için güvenli tutmaya yardım ediyorsun.',
  prototypeNote: 'Prototip: bildirimler şimdilik bu telefonda kalıyor; veritabanı bağlanınca ekibe gidecek.',
  close: 'Tamam',
};

export const en: typeof tr = {
  title: 'Report',
  titleGeneral: 'Report to the team',
  generalIntro:
    'If someone bothered you or something went wrong, tell us. Also use this if someone you blocked keeps bothering you from another account or another way.',
  usernamePlaceholder: 'Person involved (optional): @username',
  usernameA11y: 'Username of the person involved, optional',
  kind: { user: 'Profile', post: 'Post', message: 'Message' },
  why: 'Why are you reporting this?',
  reasons: {
    taciz: 'Harassment or repeated unwanted contact',
    tehdit: 'Threats or violence',
    cinsel: 'Unwanted sexual content or messages',
    nefret: 'Hate speech or discrimination',
    spam: 'Spam or scams',
    sahte: 'Fake account or impersonation',
    yas: 'May be under 18',
    diger: 'Something else',
  },
  notePlaceholder: 'What happened? (optional)',
  notePlaceholderRequired: 'What happened? Who, where, when: tell us briefly.',
  noteA11y: 'Describe what happened',
  alsoBlock: (name: string) => `Block ${name}`,
  alsoBlockNote: 'You won’t see or message each other.',
  privateNote: 'Your report is private: the person won’t know. Even if the message is deleted at 04:00, the team can see it.',
  emergency: 'If anyone is in immediate danger, call 112 now.',
  send: 'Send',
  sentTitle: 'Your report reached our team',
  sentNote: 'We’ll review it and close the account if needed. Thanks for helping keep the app safe for everyone.',
  prototypeNote: 'Prototype: reports stay on this phone for now; they’ll reach the team once the database is connected.',
  close: 'Done',
};
