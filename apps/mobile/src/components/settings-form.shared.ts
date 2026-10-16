import type { BackdropVariant } from '@/constants/theme';
import type { AppearanceMode, AppearanceUI, PresenceVisibility } from '@/data/store';

/** "Şu an burada" seçeneklerinin sonucu, seçeneğin altında bir satırda (TASARIM.md §5.9). */
export const PRESENCE_NOTE: Record<PresenceVisibility, string> = {
  herkes: 'Yer bildirdiğinde bulunduğun mekânı herkes görür.',
  karsilikli: 'Yalnızca karşılıklı takipleştiğin kişiler hangi mekânda olduğunu görür.',
  kimse: 'Kimse hangi mekânda olduğunu görmez; sohbette yine görünürsün.',
};

export const APPEARANCE_NOTE: Record<AppearanceMode, string> = {
  system: 'iPhone’un açık/koyu ayarını izler.',
  light: 'Her zaman açık görünüm: beyaz zemin ve marka gradyanı.',
  dark: 'Her zaman koyu görünüm: siyah zemin ve marka gradyanı.',
};

/** Tasarım denemesi (geçici): görünüm alanının üç seçeneği (T-19). */
export const APPEARANCE_UI_LABEL: Record<AppearanceUI, string> = {
  onizleme: '1 · Önizlemeli kartlar',
  ios: '2 · iOS gibi (Otomatik)',
  menu: '3 · Menü satırı',
};

/** Tasarım denemesi (geçici): zemin varyantları (T-18). */
export const BACKDROP_LABEL: Record<BackdropVariant, string> = {
  ust: 'A · Üst ışıklar',
  kose: 'B · Üst + sağ alt',
  genis: 'C · Geniş (Revolut gibi)',
};
