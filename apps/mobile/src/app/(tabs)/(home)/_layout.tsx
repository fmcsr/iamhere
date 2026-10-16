import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';

export default function HomeStack() {
  return (
    <TabStack>
      {/* Başlık çubuğu yok: HERE satırı içerikle birlikte kayar, yalnızca Dynamic Island çevresi bulanıklaşır. */}
      <Stack.Screen name="index" options={{ title: 'Ana Sayfa', headerShown: false }} />
    </TabStack>
  );
}
