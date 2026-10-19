import { Platform, Settings } from 'react-native';

import type { Category } from '@/data/mock';

import * as common from './strings/common';
import * as home from './strings/home';
import * as messages from './strings/messages';
import * as profile from './strings/profile';
import * as settings from './strings/settings';

/**
 * Uygulamanın dilleri (T-29): Türkçe ve İngilizce. Metinler `strings/` altında, her alan için ayrı dosyada;
 * İngilizcesi Türkçesiyle aynı biçimde olmak zorunda (TypeScript denetler). Bileşenler `useT()` kullanır.
 */
export type Lang = 'tr' | 'en';
/** Ayarlar › Dil: telefonun dilini izle ya da hep Türkçe / İngilizce. Cihazda saklanır. */
export type LanguageSetting = 'system' | Lang;

export const STRINGS = {
  tr: { ...common.tr, settings: settings.tr, home: home.tr, messages: messages.tr, profile: profile.tr },
  en: { ...common.en, settings: settings.en, home: home.en, messages: messages.en, profile: profile.en },
};
export type Strings = (typeof STRINGS)['tr'];

/** Telefonun ilk tercih ettiği dil Türkçe ise Türkçe, değilse İngilizce. */
export function systemLang(): Lang {
  let preferred: string | undefined;
  try {
    if (Platform.OS === 'ios') preferred = (Settings.get('AppleLanguages') as string[] | undefined)?.[0];
  } catch {
    // Ayar okunamazsa Intl'e bakılır.
  }
  preferred ??= Intl.DateTimeFormat().resolvedOptions().locale;
  return preferred?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export const resolveLang = (setting: LanguageSetting): Lang => (setting === 'system' ? systemLang() : setting);

let current: Lang = systemLang();

/** Seçili dil. Store değiştirir; React dışındaki yardımcılar (zaman, mesafe, tarih) buradan okur. */
export const getLang = () => current;
export const setLang = (lang: Lang) => {
  current = lang;
};

/** React dışındaki yardımcılar için metinler; bileşenler dil değişince yeniden çizilsin diye `useT()` kullanır. */
export const strings = (): Strings => STRINGS[current];

/** Mekân kategorisinin adı, seçili dilde ("Konser" · "Concert"). */
export const categoryLabel = (category: Category) => STRINGS[current].categories[category];
