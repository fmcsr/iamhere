import { Stack } from 'expo-router';
import type { ComponentProps } from 'react';

import { HeaderFonts } from '@/constants/theme';
import { useBackdrop } from '@/hooks/use-backdrop';

/** Sekme içi yığın: zemin marka gradyanı, başlıklar DM Sans, geri düğmesi yalnızca ok (iOS 26 cam daire). */
export function TabStack({ screenOptions, ...props }: ComponentProps<typeof Stack>) {
  const backdrop = useBackdrop();
  return (
    <Stack
      {...props}
      screenOptions={{ headerBackButtonDisplayMode: 'minimal', contentStyle: backdrop, ...HeaderFonts, ...(screenOptions as object) }}
    />
  );
}
