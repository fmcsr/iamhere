import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';
import { useT } from '@/i18n/use-t';

export default function MessagesStack() {
  const t = useT();
  return (
    <TabStack>
      <Stack.Screen name="index" options={{ title: t.tabs.messages, headerShown: false }} />
      <Stack.Screen name="requests" options={{ title: t.messages.requests.title }} />
    </TabStack>
  );
}
