import { Stack } from 'expo-router';

export default function ExploreStack() {
  return (
    <Stack>
      {/* Tam ekran harita; başlık yerine haritanın üstünde yüzen cam kontroller var. */}
      <Stack.Screen name="index" options={{ title: 'Keşfet', headerShown: false }} />
    </Stack>
  );
}
