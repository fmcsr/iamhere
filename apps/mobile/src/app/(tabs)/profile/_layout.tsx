import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';
import { useT } from '@/i18n/use-t';

export default function ProfileStack() {
  const t = useT();
  return (
    <TabStack>
      <Stack.Screen name="index" options={{ title: t.tabs.profile, headerShown: false }} />
    </TabStack>
  );
}
