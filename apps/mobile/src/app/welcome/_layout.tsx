import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';

// Çıkışta koruma (Stack.Protected) bu yığına düşer; ilk ekran dosya sırasından bağımsız, her zaman hoş geldin.
export const unstable_settings = { anchor: 'index' };

/** Giriş öncesi yığın: hoş geldin, telefon numarası, kod. */
export default function WelcomeStack() {
  return (
    <TabStack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="phone" options={{ title: '' }} />
      <Stack.Screen name="code" options={{ title: '' }} />
    </TabStack>
  );
}
