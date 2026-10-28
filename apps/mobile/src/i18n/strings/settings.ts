import type { BackdropVariant } from '@/constants/theme';
import type { AppearanceMode, AppearanceUI, PresenceVisibility } from '@/data/store';
import type { LanguageSetting } from '@/i18n';

/** Ayarlar (TASARIM.md §5.9): hesap, tasarım denemesi, görünüm, dil, gizlilik, güvenlik. */
export const tr = {
  account: 'Hesap',
  editProfile: 'Profili düzenle',
  trial: {
    title: 'Tasarım denemesi',
    note: 'Geçici: seçenekleri karşılaştırmak için. Karar verilince bu bölüm kalkacak.',
    appearanceUI: 'Görünüm alanı',
    backdrop: 'Zemin',
    backdropShort: { ust: 'A · Üst', kose: 'B · Köşe', genis: 'C · Geniş' } as Record<BackdropVariant, string>,
    appearanceUILabel: {
      onizleme: '1 · Önizlemeli kartlar',
      ios: '2 · iOS gibi (Otomatik)',
      menu: '3 · Menü satırı',
    } as Record<AppearanceUI, string>,
    backdropLabel: {
      ust: 'A · Üst ışıklar',
      kose: 'B · Üst + sağ alt',
      genis: 'C · Geniş (Revolut gibi)',
    } as Record<BackdropVariant, string>,
  },
  appearance: {
    title: 'Görünüm',
    mode: { system: 'Sistem', light: 'Açık', dark: 'Koyu' } as Record<AppearanceMode, string>,
    note: {
      system: 'iPhone’un açık/koyu ayarını izler.',
      light: 'Her zaman açık görünüm: beyaz zemin ve marka gradyanı.',
      dark: 'Her zaman koyu görünüm: siyah zemin ve marka gradyanı.',
    } as Record<AppearanceMode, string>,
    automatic: 'Otomatik',
    automaticNote: 'Otomatik açıkken iPhone’un açık/koyu ayarını izler.',
  },
  language: {
    title: 'Dil',
    /** Dil adları her dilde kendi yazılışıyla. */
    option: { system: 'Sistem', tr: 'Türkçe', en: 'English' } as Record<LanguageSetting, string>,
    note: 'Sistem: iPhone’un dilini izler (Türkçe değilse İngilizce).',
  },
  privacy: {
    title: 'Gizlilik',
    privateAccount: 'Gizli hesap',
    privateNote: 'Gizli hesapta paylaşımlarını yalnızca onayladığın takipçiler görür.',
  },
  presence: {
    title: 'Şu an burada kimler görsün',
    label: 'Şu an burada',
    option: { herkes: 'Herkes', karsilikli: 'Karşılıklı takipleştiklerim', kimse: 'Kimse' } as Record<PresenceVisibility, string>,
    optionShort: { herkes: 'Herkes', karsilikli: 'Karşılıklı', kimse: 'Kimse' } as Record<PresenceVisibility, string>,
    note: {
      herkes: 'Yer bildirdiğinde bulunduğun mekânı herkes görür: Burada listesi, profilindeki halka ve takviminde bu gece.',
      karsilikli: 'Yalnızca karşılıklı takipleştiğin kişiler hangi mekânda olduğunu görür: Burada listesi, profilindeki halka ve takviminde bu gece.',
      kimse: 'Kimse hangi mekânda olduğunu görmez; sohbette yine @kullanıcı adınla görünürsün.',
    } as Record<PresenceVisibility, string>,
  },
  safety: {
    title: 'Güvenlik',
    blocked: 'Engellenenler',
    muted: 'Sessize alınanlar',
    empty: 'Henüz kimse yok.',
    footer: 'I am Here · prototip · #iamhere',
  },
  signOut: {
    button: 'Çıkış yap',
    confirm: 'Çıkış yapılsın mı?',
    note: 'Profilin ve ayarların bu cihazda kalır.',
  },
};

export const en: typeof tr = {
  account: 'Account',
  editProfile: 'Edit profile',
  trial: {
    title: 'Design trial',
    note: 'Temporary: for comparing options. This section goes away once we decide.',
    appearanceUI: 'Appearance picker',
    backdrop: 'Backdrop',
    backdropShort: { ust: 'A · Top', kose: 'B · Corner', genis: 'C · Wide' },
    appearanceUILabel: { onizleme: '1 · Preview cards', ios: '2 · Like iOS (Automatic)', menu: '3 · Menu row' },
    backdropLabel: { ust: 'A · Top glow', kose: 'B · Top + bottom right', genis: 'C · Wide (like Revolut)' },
  },
  appearance: {
    title: 'Appearance',
    mode: { system: 'System', light: 'Light', dark: 'Dark' },
    note: {
      system: 'Follows your iPhone’s light/dark setting.',
      light: 'Always light: white background with the brand gradient.',
      dark: 'Always dark: black background with the brand gradient.',
    },
    automatic: 'Automatic',
    automaticNote: 'When Automatic is on, follows your iPhone’s light/dark setting.',
  },
  language: {
    title: 'Language',
    option: { system: 'System', tr: 'Türkçe', en: 'English' },
    note: 'System follows your iPhone’s language (English unless it’s Turkish).',
  },
  privacy: {
    title: 'Privacy',
    privateAccount: 'Private account',
    privateNote: 'With a private account, only followers you approve see your posts.',
  },
  presence: {
    title: 'Who sees where you are',
    label: 'Here now',
    option: { herkes: 'Everyone', karsilikli: 'Mutual follows', kimse: 'No one' },
    optionShort: { herkes: 'Everyone', karsilikli: 'Mutual', kimse: 'No one' },
    note: {
      herkes: 'When you check in, everyone sees the venue you’re at: in Who’s here, the ring on your profile and tonight on your calendar.',
      karsilikli: 'Only people you follow mutually see which venue you’re at: in Who’s here, the ring on your profile and tonight on your calendar.',
      kimse: 'No one sees which venue you’re at; you still appear in the chat with your @username.',
    },
  },
  safety: {
    title: 'Safety',
    blocked: 'Blocked',
    muted: 'Muted',
    empty: 'No one yet.',
    footer: 'I am Here · prototype · #iamhere',
  },
  signOut: {
    button: 'Sign out',
    confirm: 'Sign out?',
    note: 'Your profile and settings stay on this device.',
  },
};
