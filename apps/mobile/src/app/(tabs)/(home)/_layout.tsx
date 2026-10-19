import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';
import { useT } from '@/i18n/use-t';

export default function HomeStack() {
  const t = useT();
  return (
    <TabStack>
      {/* Başlık çubuğu yok: HERE satırı içerikle birlikte kayar, yalnızca Dynamic Island çevresi bulanıklaşır. */}
      <Stack.Screen name="index" options={{ title: t.tabs.home, headerShown: false }} />
    </TabStack>
  );
}
