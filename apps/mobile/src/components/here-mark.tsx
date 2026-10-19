import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { HERE_SPRITE } from '@/components/here-mark-sprite';

const SHEET = require('@/assets/images/here-spin.webp');

/**
 * HERE logosu: fuşya, parlak, şişirilmiş balon harfler (TASARIM.md T-23). Üç boyutlu logo
 * 60 açıdan önceden çizildi (scripts/generate-brand.py); `angle` (derece) verilirse o açının karesi
 * gösterilir. Aşağı çekip yenilerken soldan sağa döner. `height`, karenin yüksekliği (harfler biraz kısa).
 */
export function HereMark({ height = 40, angle }: { height?: number; angle?: SharedValue<number> }) {
  const { frames, columns, rows, frameWidth, frameHeight } = HERE_SPRITE;
  const width = (frameWidth * height) / frameHeight;
  const sheet = useAnimatedStyle(() => {
    const turns = (angle ? angle.get() : 0) / 360;
    const index = (((Math.round(turns * frames) % frames) + frames) % frames) | 0;
    return {
      transform: [{ translateX: -(index % columns) * width }, { translateY: -Math.floor(index / columns) * height }],
    };
  });

  return (
    <View style={{ width, height, overflow: 'hidden' }} accessible accessibilityRole="image" accessibilityLabel="HERE">
      <Animated.View style={[{ width: width * columns, height: height * rows }, sheet]}>
        <Image source={SHEET} style={StyleSheet.absoluteFill} contentFit="fill" />
      </Animated.View>
    </View>
  );
}
