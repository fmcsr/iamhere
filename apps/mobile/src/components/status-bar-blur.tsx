import MaskedViewBase from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentType, ReactElement } from 'react';
import { Platform, StyleSheet, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Paketin sınıf tipleri React 19 tipleriyle uyuşmuyor; bileşen aynı, yalnızca tip düzeltiliyor.
const MaskedView = MaskedViewBase as unknown as ComponentType<ViewProps & { maskElement: ReactElement }>;

/**
 * Dynamic Island ve durum çubuğunun altına kademeli bulanıklık (Instagram, Ekim 2026 gibi):
 * üstte güçlü, aşağı doğru yumuşakça kaybolur. Başlık çubuğu olmayan, içeriği kaydıkça
 * kaybolan ekranlarda kullanılır. Dokunuşları engellemez.
 */
export function StatusBarBlur() {
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === 'dark';
  const height = insets.top + 18;
  const frame = [styles.frame, { height }];

  if (Platform.OS !== 'ios') {
    // MaskedView yalnızca iOS/Android'de; burada sade bir renk geçişi yeterli.
    return (
      <LinearGradient
        pointerEvents="none"
        colors={dark ? ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
        style={frame}
      />
    );
  }

  return (
    <MaskedView
      pointerEvents="none"
      style={frame}
      maskElement={<LinearGradient colors={['#000', '#000', 'transparent']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />}>
      <BlurView intensity={60} tint={dark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'} style={StyleSheet.absoluteFill} />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'absolute', top: 0, left: 0, right: 0 },
});
