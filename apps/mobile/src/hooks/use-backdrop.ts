import type { ViewStyle } from 'react-native';

import { Backdrops } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Seçili zemin denemesinin (T-18) açık ya da koyu hâli; yığınların `contentStyle`'ı için. */
export function useBackdrop(): ViewStyle {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { trial } = useApp();
  return Backdrops[trial.backdrop][scheme];
}
