import type { PresenceVisibility } from '@/data/store';
import type { UsernameProblem } from '@/lib/profile-rules';

/** Profil, başkasının profili, sekmeler, paylaşımlar, takipçi listeleri, anılar ve Profili düzenle (T-29). */
export const tr = {
  /** Kendi profilin: kapaktaki paylaş düğmesi ve paylaşım metni. */
  me: {
    share: 'Profili paylaş',
    shareMessage: (username: string) => `HERE'de @${username} #iamhere`,
  },
  /** Başkasının profili. */
  user: {
    notFound: 'Kullanıcı bulunamadı.',
    message: 'Mesaj',
    requestNote: 'Karşılıklı takipleşmediğiniz için mesajın onun “İstekler” bölümüne düşer.',
    privateTitle: 'Bu hesap gizli',
    blockedTitle: 'Bu kişiyi engelledin',
    blockedNote: 'Birbirinizin profilini, paylaşımlarını ve mesajlarını görmüyorsunuz.',
    privateNote: 'Paylaşımlarını ve gecelerini görmek için takip isteği gönder.',
  },
  /** Takip kapsülü ve takibi bırakma onayı (başkasının profili ve takipçi listeleri). */
  follow: {
    follow: 'Takip et',
    followBack: 'Geri takip et',
    request: 'İstek gönder',
    requested: 'İstek gönderildi',
    following: 'Takip ediliyor',
    unfollow: 'Takibi bırak',
    unfollowConfirm: (username: string) => `@${username} takibi bırakılsın mı?`,
  },
  /** Profil kimliğindeki sayıların etiketleri; sayı ayrı ve iri yazılır, burada yalnızca altındaki sözcük. */
  header: {
    followers: (n: number) => 'takipçi',
    following: 'takip',
    memories: (n: number) => 'anı',
  },
  /** Profilin alt sekmeleri (Paylaşımlar ortak `titles.posts`). */
  tabs: {
    tagged: 'Etiketlenenler',
    saved: 'To-HERE',
    a11y: 'Profil bölümleri',
    noPosts: 'Henüz paylaşım yok.',
    noPostsMine: 'Henüz paylaşım yok. Bir mekânda yer bildirip ilk fotoğrafını paylaş.',
    noTagged: (name: string) => `${name} henüz bir paylaşımda etiketlenmemiş.`,
    noTaggedMine: 'Arkadaşların seni bir paylaşımda etiketleyince burada görünür.',
    noSaved: (name: string) => `${name} henüz gitmek istediği bir mekân kaydetmemiş.`,
    noSavedMine: 'Gitmek istediğin mekânları, mekân sayfasındaki kaydet düğmesiyle buraya ekle.',
    savedCountMine: (n: number) => `Gitmek istediğin ${n} yer`,
    /** `nameGenitive`: iyelik ekli ad ("Zeynep'in"); İngilizcede yalın ad kullanılır. */
    savedCount: (name: string, nameGenitive: string, n: number) => `${nameGenitive} gitmek istediği ${n} yer`,
    venues: (n: number) => `${n} mekân`,
    both: 'İkiniz de',
    bothA11y: 'ikiniz de gitmek istiyorsunuz',
    /** `namesToo`: "Zeynep ve Can da" (alsoName); İngilizcede yalın adlar. */
    savedToo: (names: string, namesToo: string) => `${namesToo} kaydetti`,
  },
  /** Paylaşım ızgarası. */
  masonry: {
    posts: (n: number) => `${n} paylaşım`,
    post: (venue: string, text: string) => `${venue} paylaşımı. ${text}`,
  },
  /** Paylaşımlar sayfasının başlığı (başkasınınki @kullanıcı adı ya da `tabs.tagged`). */
  posts: {
    mine: 'Paylaşımların',
    taggedMine: 'Etiketlendiklerin',
  },
  /** Takipçiler ve takip edilenler. */
  follows: {
    followers: (n: number) => `${n} takipçi`,
    following: (n: number) => `${n} takip`,
    a11y: 'Liste',
    search: 'Ara',
    you: 'Sen',
    mutual: 'Karşılıklı takipleşiyorsunuz',
    followsYou: 'Seni takip ediyor',
    noMatch: (query: string) => `“${query}” adında kimse yok.`,
    noFollowers: 'Henüz takipçi yok.',
    noFollowing: 'Henüz kimseyi takip etmiyor.',
  },
  /** Anılar (anı takvimi sayfası). */
  memories: {
    titleMine: 'Anıların',
    /** `owner`: iyelik ekli ad ("Zeynep'in" · "Zeynep’s"). */
    title: (owner: string) => `${owner} anıları`,
    /** Kendi takviminin kimlere açık olduğu (S4): geçmiş geceler hesabın gizliliğine, bu gece "Şu an burada" ayarına bağlı. */
    visibility: (privateAccount: boolean, tonight: PresenceVisibility) =>
      `${privateAccount ? 'Onaylı takipçilerin' : 'Herkes'} görür · bu gece ${{ herkes: 'herkes', karsilikli: 'karşılıklılar', kimse: 'yalnızca sen' }[tonight]}`,
    publicAccount: 'Açık hesap: geçmiş geceleri herkes görür',
    follower: 'Onaylı takipçisi olduğun için görüyorsun',
    hidden: 'Bu hesap gizli. Gecelerini yalnızca onaylı takipçileri görür.',
  },
  /** Anı takvimi. */
  calendar: {
    previous: 'Önceki ay',
    next: 'Sonraki ay',
    a11y: (month: string, nights: number) => `${month}: ${nights} gece`,
    /** Bir gecenin karesi: tarih ve mekân. */
    night: (date: string, venue: string) => `${date}, ${venue}`,
  },
  /** Profili düzenle (sayfa başlığı ortak `titles.editProfile`). */
  edit: {
    save: 'Kaydet',
    avatarTitle: 'Profil fotoğrafı',
    coverTitle: 'Kapak fotoğrafı',
    changeAvatar: 'Profil fotoğrafını değiştir',
    changeCover: 'Kapak fotoğrafını değiştir',
    fromLibrary: 'Fotoğraflardan seç',
    takePhoto: 'Fotoğraf çek',
    removePhoto: 'Fotoğrafı kaldır',
    useLastNight: 'Son gecenin fotoğrafını kullan',
    /** Kamera izni yoksa; "Ayarlar" telefonun Ayarlar uygulaması. */
    cameraDenied: {
      title: 'Kamera izni gerekli',
      message: 'Fotoğraf çekmek için Ayarlar › HERE › Kamera iznini aç.',
      settings: 'Ayarlar',
    },
    saveFailed: {
      title: 'Kaydedilemedi',
      message: 'Fotoğraf kaydedilirken bir sorun oldu. Yeniden dene.',
    },
    discard: {
      title: 'Değişiklikler kaydedilmesin mi?',
      keepEditing: 'Düzenlemeye devam et',
      discard: 'Değişiklikleri at',
    },
    name: 'Ad',
    namePlaceholder: 'Adın',
    nameEmpty: 'Adın boş olamaz.',
    username: 'Kullanıcı adı',
    /** profile-rules.ts'teki `usernameProblem` sonucunun metni. */
    usernameProblem: {
      short: 'En az 3 karakter olmalı.',
      dots: 'Nokta başta, sonda ya da art arda olamaz.',
      taken: 'Bu kullanıcı adı alınmış.',
    } as Record<UsernameProblem, string>,
    bio: 'Hakkında',
    bioPlaceholder: 'Kendinden kısaca bahset',
    interests: 'İlgi alanları',
  },
};

export const en: typeof tr = {
  me: {
    share: 'Share profile',
    shareMessage: (username: string) => `@${username} on HERE #iamhere`,
  },
  user: {
    notFound: 'User not found.',
    message: 'Message',
    requestNote: 'You don’t follow each other, so your message will go to their “Requests”.',
    privateTitle: 'This account is private',
    blockedTitle: 'You blocked this person',
    blockedNote: 'You don’t see each other’s profile, posts or messages.',
    privateNote: 'Send a follow request to see their posts and nights out.',
  },
  follow: {
    follow: 'Follow',
    followBack: 'Follow back',
    request: 'Request',
    requested: 'Requested',
    following: 'Following',
    unfollow: 'Unfollow',
    unfollowConfirm: (username: string) => `Unfollow @${username}?`,
  },
  header: {
    followers: (n: number) => (n === 1 ? 'follower' : 'followers'),
    following: 'following',
    memories: (n: number) => (n === 1 ? 'memory' : 'memories'),
  },
  tabs: {
    tagged: 'Tagged',
    saved: 'To-HERE',
    a11y: 'Profile sections',
    noPosts: 'No posts yet.',
    noPostsMine: 'No posts yet. Check in at a venue and share your first photo.',
    noTagged: (name: string) => `${name} hasn’t been tagged in any posts yet.`,
    noTaggedMine: 'When friends tag you in a post, it’ll show up here.',
    noSaved: (name: string) => `${name} hasn’t saved any places to go yet.`,
    noSavedMine: 'Use the save button on a venue’s page to add places you want to go.',
    savedCountMine: (n: number) => (n === 1 ? '1 place you want to go' : `${n} places you want to go`),
    savedCount: (name: string, nameGenitive: string, n: number) => `${n === 1 ? '1 place' : `${n} places`} ${name} wants to go`,
    venues: (n: number) => (n === 1 ? '1 venue' : `${n} venues`),
    both: 'Both of you',
    bothA11y: 'you both want to go',
    savedToo: (names: string, namesToo: string) => `${names} saved it too`,
  },
  masonry: {
    posts: (n: number) => (n === 1 ? '1 post' : `${n} posts`),
    post: (venue: string, text: string) => `Post at ${venue}. ${text}`,
  },
  posts: {
    mine: 'Your posts',
    taggedMine: 'Tagged',
  },
  follows: {
    followers: (n: number) => (n === 1 ? '1 follower' : `${n} followers`),
    following: (n: number) => `${n} following`,
    a11y: 'List',
    search: 'Search',
    you: 'You',
    mutual: 'You follow each other',
    followsYou: 'Follows you',
    noMatch: (query: string) => `No one matches “${query}”.`,
    noFollowers: 'No followers yet.',
    noFollowing: 'Not following anyone yet.',
  },
  memories: {
    titleMine: 'Your memories',
    title: (owner: string) => `${owner} memories`,
    visibility: (privateAccount: boolean, tonight: PresenceVisibility) =>
      `${privateAccount ? 'Your approved followers' : 'Everyone'} can see · tonight ${{ herkes: 'everyone', karsilikli: 'mutuals', kimse: 'only you' }[tonight]}`,
    publicAccount: 'Public account: everyone can see past nights',
    follower: 'Visible because you’re an approved follower',
    hidden: 'This account is private. Only approved followers see their nights.',
  },
  calendar: {
    previous: 'Previous month',
    next: 'Next month',
    a11y: (month: string, nights: number) => `${month}: ${nights === 1 ? '1 night' : `${nights} nights`}`,
    night: (date: string, venue: string) => `${date}, ${venue}`,
  },
  edit: {
    save: 'Save',
    avatarTitle: 'Profile photo',
    coverTitle: 'Cover photo',
    changeAvatar: 'Change profile photo',
    changeCover: 'Change cover photo',
    fromLibrary: 'Choose from library',
    takePhoto: 'Take photo',
    removePhoto: 'Remove photo',
    useLastNight: 'Use photo from your last night out',
    cameraDenied: {
      title: 'Camera access needed',
      message: 'To take a photo, allow camera access in Settings › HERE › Camera.',
      settings: 'Settings',
    },
    saveFailed: {
      title: 'Couldn’t save',
      message: 'Something went wrong while saving the photo. Try again.',
    },
    discard: {
      title: 'Discard changes?',
      keepEditing: 'Keep editing',
      discard: 'Discard',
    },
    name: 'Name',
    namePlaceholder: 'Your name',
    nameEmpty: 'Name can’t be empty.',
    username: 'Username',
    usernameProblem: {
      short: 'Username must be at least 3 characters.',
      dots: 'Periods can’t be first, last, or in a row.',
      taken: 'This username is taken.',
    },
    bio: 'Bio',
    bioPlaceholder: 'Tell people a little about yourself',
    interests: 'Interests',
  },
};
