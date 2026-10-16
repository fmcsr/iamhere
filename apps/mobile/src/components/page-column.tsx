import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

/**
 * Sayfa sütunu: kaydırma görünümünün içinde kullanılır. Yatay güvenli alanlara uyar (iOS 27'de
 * geniş ekranlarda içeriğin üstünde yüzen cam kenar çubuğu, iPhone Duo'nun yan durum çubuğu) ve
 * geniş ekranda okunur genişlikte ortalanır.
 */
export function PageColumn({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView edges={{ left: true, right: true }}>
      <View style={[styles.column, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 680, alignSelf: 'center' },
});
