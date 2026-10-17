import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';

export default function MessagesStack() {
  return (
    <TabStack>
      <Stack.Screen name="index" options={{ title: 'Mesajlar', headerShown: false }} />
      <Stack.Screen name="requests" options={{ title: 'İstekler' }} />
    </TabStack>
  );
}
