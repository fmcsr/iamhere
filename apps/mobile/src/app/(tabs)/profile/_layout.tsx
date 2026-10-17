import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';

export default function ProfileStack() {
  return (
    <TabStack>
      <Stack.Screen name="index" options={{ title: 'Profil', headerShown: false }} />
    </TabStack>
  );
}
