import MaskedViewBase from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useState, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// Paketin sınıf tipleri React 19 tipleriyle uyuşmuyor; bileşen aynı, yalnızca tip düzeltiliyor.
const MaskedView = MaskedViewBase as unknown as ComponentType<ViewProps & { maskElement: ReactElement }>;

/** Kapağın durum çubuğu altındaki yüksekliği. */
export const COVER_HEIGHT = 196;

/**
 * Profil kapağı (BeReal'deki büyük üst fotoğraf gibi): kişinin son gecesinin fotoğrafı bulanık, aşağı doğru
 * zemine karışır. Üstünde ortada kullanıcı adı, yanlarda cam düğmeler; altta küçük "Son gece" etiketi.
 * Ekranın en üstünden başlar: kaydırma görünümünün güvenli alan boşluğu kadar yukarı taşınır.
 */
export function ProfileCover({
  uri,
  title,
  left,
  right,
  chip,
  statusFade,
}: {
  uri?: string;
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  chip?: string;
  /** Durum çubuğu rengi değiştirilemiyorsa (sekme içindeki ekranlar): saat her fotoğrafta okunsun diye üstte temaya uygun ince geçiş. */
  statusFade?: boolean;
}) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const height = insets.top + COVER_HEIGHT;

  return (
    <View style={{ height, marginTop: -insets.top }}>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={<LinearGradient colors={['#000', '#000', 'transparent']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />}>
        {uri ? (
          <Image source={{ uri }} style={styles.photo} contentFit="cover" blurRadius={22} transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.accentSoft }]} />
        )}
        {/* Hafif karartma: beyaz kullanıcı adı ve durum çubuğu her fotoğrafta okunsun. */}
        <View style={[StyleSheet.absoluteFill, styles.shade]} />
      </MaskedView>
      {statusFade && (
        <LinearGradient
          pointerEvents="none"
          colors={dark ? ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)'] : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
          style={[styles.fade, { height: insets.top + 6 }]}
        />
      )}

      <View style={[styles.bar, { top: insets.top + 4 }]}>
        <View style={styles.side}>{left}</View>
        <Text style={[Type.headline, styles.title]} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>

      {chip && (
        <Glass style={[styles.chip, { top: height - 104 }]}>
          <Icon ios="mappin.and.ellipse" md="location_on" size={12} color="#fff" />
          <Text style={styles.chipText} numberOfLines={1}>
            {chip}
          </Text>
        </Glass>
      )}
    </View>
  );
}

/**
 * Kapak koyu bir fotoğraf olduğu için durum çubuğu kapağın üstündeyken açık renk; aşağı kaydırınca
 * (açık modda) yeniden koyu. Ekrandan çıkınca sistem ayarına döner. `overCover`: kapak hâlâ durum
 * çubuğunun altında mı (o sırada ada bulanıklığına gerek yok; kapağın kendisi bulanık).
 */
export function useCoverStatusBar({ setStyle = true }: { setStyle?: boolean } = {}) {
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [overCover, setOverCover] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!setStyle) return;
      setStatusBarStyle(overCover || dark ? 'light' : 'dark', true);
      return () => setStatusBarStyle('auto', true);
    }, [overCover, dark, setStyle]),
  );

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Kaydırma en üstteyken konum -insets.top (güvenli alan boşluğu).
    const next = event.nativeEvent.contentOffset.y + insets.top < COVER_HEIGHT - 60;
    if (next !== overCover) setOverCover(next);
  };
  return { onScroll, overCover };
}

const styles = StyleSheet.create({
  photo: { position: 'absolute', top: -30, left: -30, right: -30, bottom: -30 },
  shade: { backgroundColor: 'rgba(0, 0, 0, 0.18)' },
  fade: { position: 'absolute', top: 0, left: 0, right: 0 },
  bar: { position: 'absolute', left: 16, right: 16, height: 44, flexDirection: 'row', alignItems: 'center' },
  side: { width: 92, flexDirection: 'row', gap: 8 },
  sideRight: { justifyContent: 'flex-end' },
  title: { flex: 1, textAlign: 'center', color: '#fff', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6 },
  chip: { position: 'absolute', right: 16, flexDirection: 'row', alignItems: 'center', gap: 5, height: 28, paddingHorizontal: 10, borderRadius: 14, maxWidth: 220 },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
