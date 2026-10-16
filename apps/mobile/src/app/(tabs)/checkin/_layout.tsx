import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';

export default function CheckInStack() {
  return (
    <TabStack>
      <Stack.Screen name="index" options={{ title: 'Buradayım' }} />
    </TabStack>
  );
}
