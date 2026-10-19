import { Stack } from 'expo-router';

import { useT } from '@/i18n/use-t';

export default function ExploreStack() {
  const t = useT();
  return (
    <Stack>
      {/* Tam ekran harita; başlık yerine haritanın üstünde yüzen cam kontroller var. */}
      <Stack.Screen name="index" options={{ title: t.tabs.explore, headerShown: false }} />
    </Stack>
  );
}
