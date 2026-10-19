import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/glass';
import { Icon, type SFSymbolName } from '@/components/icon';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Başlık çubuğu olmayan ekranların içerikle kayan başlığı (ana sayfadaki gibi): ortada başlık,
 * sağda cam daire düğmeler. Üstte yalnızca Dynamic Island çevresindeki bulanıklık kalır (StatusBarBlur).
 */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <Text style={[Type.headline, { color: theme.text }]} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

/** Başlıktaki cam daire düğme (iOS 26 başlık düğmeleri gibi). `onImage`: fotoğraf üstünde (profil kapağı), simge beyaz. */
export function HeaderButton({
  icon,
  md,
  label,
  onPress,
  onImage,
}: {
  icon: SFSymbolName;
  md: Parameters<typeof Icon>[0]['md'];
  label: string;
  onPress: () => void;
  onImage?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      <Glass style={styles.button} interactive>
        <Icon ios={icon} md={md} size={18} color={onImage ? '#fff' : theme.text} />
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 96 },
  right: { position: 'absolute', right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  button: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
