import { Pressable, StyleSheet } from 'react-native';

import { Icon, type SFSymbolName } from '@/components/icon';
import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';

type IconName = { ios: SFSymbolName; md: Parameters<typeof Icon>[0]['md'] };

/**
 * Küçük kapsül düğme (profildeki "Düzenle", listelerdeki "Takip et"). Büyük tam genişlik düğmeler yerine
 * satır içinde durur. `ink`: metin renginde dolgu (Takip et, T-7) · `fill`: yarı saydam gri.
 */
export function Pill({
  title,
  icon,
  tone = 'fill',
  onPress,
  accessibilityLabel,
}: {
  title: string;
  icon?: IconName;
  tone?: 'fill' | 'ink';
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const ink = tone === 'ink';
  const color = ink ? theme.inverseText : theme.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      hitSlop={6}
      style={({ pressed }) => [styles.pill, { backgroundColor: ink ? theme.text : theme.fill, opacity: pressed ? 0.7 : 1 }]}>
      {icon && <Icon ios={icon.ios} md={icon.md} size={14} color={color} />}
      <Text style={[styles.title, { color }]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 14, borderRadius: 17 },
  title: { fontSize: 15, fontWeight: '600' },
});
