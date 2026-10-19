import { useApp } from '@/data/store';
import { STRINGS, type Strings } from '@/i18n';

/** Seçili dilin metinleri; dil değişince bileşen yeniden çizilir. */
export function useT(): Strings {
  return STRINGS[useApp().lang];
}
