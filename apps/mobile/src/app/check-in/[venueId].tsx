import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { LiveCount, formatDistance } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PinSlider } from '@/components/pin-slider';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { CATEGORY_LABEL, CHECK_IN_RADIUS_M } from '@/data/mock';
import { useApp } from '@/data/store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

/** Yer bildirimini kimler görür (Ayarlar › Şu an burada kimler görsün). */
const WHO_SEES = {
  herkes: 'Burada olduğunu herkes görür',
  karsilikli: 'Burada olduğunu karşılıklı takipleştiklerin görür',
  kimse: 'Burada olduğunu kimse görmez; yalnızca sohbete katılırsın',
} as const;

/**
 * Yer bildirme sayfası (TASARIM.md T-26): mekân sayfasındaki fuşya "Yer bildir" ile alttan açılır
 * (Luma'nın "Leave Event" sayfası gibi). Solda mekân ve ne olacağı, sağda fuşya oluk: iğneyi aşağı
 * kaydırınca zemine saplanır, yer bildirilir ve mekân sohbetine katılınır. Mekân 300 m'den uzaksa
 * oluk kilitli (K-17). Arka plana dokununca ya da "Vazgeç"le kapanır.
 */
export default function CheckInSheet() {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const { venueById, canCheckIn, doCheckIn, settings } = useApp();
  const venue = venueById(venueId);
  const [done, setDone] = useState(false);
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.set(withSpring(1, { damping: 20, stiffness: 190 }));
  }, [shown]);

  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(shown.get(), [0, 1], [460, 0]) }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: Math.min(shown.get(), 1) }));

  /** Sayfayı aşağı indirip kapatır; isteğe bağlı olarak ardından bir sayfa açar. */
  const close = (next?: () => void) => {
    shown.set(withTiming(0, { duration: 220 }));
    setTimeout(() => {
      router.back();
      next?.();
    }, 230);
  };

  if (!venue) return null;
  const near = canCheckIn(venue.id);

  const onPinned = () => {
    doCheckIn({ venueId: venue.id, text: '', audience: settings.lastAudience });
    // İğnenin saplanışı görünsün, sonra metin "Buradasın"a döner.
    setTimeout(() => setDone(true), 650);
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityRole="button" accessibilityLabel="Kapat" />
      </Animated.View>

      <Animated.View style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom - 18, 10) }, sheet]}>
        {/* Cam, alttaki fuşya düğmeyi göstermesin diye zemin rengiyle tonlu. */}
        <Glass variant="regular" tint={dark ? 'rgba(24, 22, 28, 0.82)' : 'rgba(255, 255, 255, 0.82)'} style={styles.sheet}>
          <View style={[styles.grabber, { backgroundColor: theme.separator }]} />
          <View style={styles.row}>
            <View style={styles.info}>
              <View style={styles.venueRow}>
                <Image source={{ uri: venue.coverUri }} style={styles.thumb} contentFit="cover" />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={[Type.headline, { color: theme.text }]} numberOfLines={2}>
                    {venue.name}
                  </Text>
                  <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
                    {CATEGORY_LABEL[venue.category]} · {formatDistance(venue.distanceM)}
                  </Text>
                </View>
              </View>

              {done ? (
                <>
                  <Text style={[Type.title2, { color: theme.text }]}>Buradasın</Text>
                  <Text style={[Type.subheadline, { color: theme.textSecondary }]}>
                    Mekân sohbetine katıldın. {WHO_SEES[settings.presenceVisibility]}.
                  </Text>
                </>
              ) : near ? (
                <>
                  <Text style={[Type.title3, { color: theme.text }]}>Burada olduğunu belirtmek üzeresin</Text>
                  <Text style={[Type.subheadline, { color: theme.textSecondary }]}>Mekân sohbetine katılmak için iğneyi aşağı kaydır.</Text>
                  <LiveCount count={venue.here} suffix="kişi burada" />
                </>
              ) : (
                <>
                  <Text style={[Type.title3, { color: theme.text }]}>Henüz yeterince yakın değilsin</Text>
                  <Text style={[Type.subheadline, { color: theme.textSecondary }]}>
                    Yer bildirmek için mekânın {CHECK_IN_RADIUS_M} m yakınında olmalısın. Şu an {formatDistance(venue.distanceM)} uzaktasın.
                  </Text>
                </>
              )}

              {!done && (
                <View style={styles.who}>
                  <Icon ios="eye" md="visibility" size={13} color={theme.textSecondary} />
                  <Text style={[Type.caption, { color: theme.textSecondary, flex: 1 }]}>{WHO_SEES[settings.presenceVisibility]}</Text>
                </View>
              )}
            </View>

            <PinSlider locked={!near} onPinned={onPinned} />
          </View>

          {done ? (
            <View style={styles.actions}>
              <View style={styles.action}>
                <ActionButton
                  title="Fotoğraf paylaş"
                  systemImage="camera"
                  variant="glass"
                  size="regular"
                  fullWidth
                  onPress={() => close(() => router.push({ pathname: '/compose', params: { venueId: venue.id } }))}
                />
              </View>
              <View style={styles.action}>
                <ActionButton
                  title="Sohbete git"
                  systemImage="bubble.left.and.bubble.right.fill"
                  variant="glassProminent"
                  size="regular"
                  fullWidth
                  onPress={() => close(() => router.push({ pathname: '/chat/[id]', params: { id: `c-${venue.id}` } }))}
                />
              </View>
            </View>
          ) : (
            <View style={styles.footer}>
              {!near && (
                <ActionButton
                  title="Yol tarifi"
                  systemImage="arrow.triangle.turn.up.right.diamond.fill"
                  variant="glass"
                  size="regular"
                  onPress={() => Linking.openURL(`https://maps.apple.com/?daddr=${venue.latitude},${venue.longitude}`)}
                />
              )}
              <Pressable onPress={() => close()} hitSlop={10} accessibilityRole="button">
                <Text style={[Type.subheadline, { color: theme.textSecondary, fontWeight: '600' }]}>Vazgeç</Text>
              </Pressable>
            </View>
          )}
        </Glass>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.32)' },
  sheetWrap: { paddingHorizontal: 10 },
  sheet: { borderRadius: 36, padding: 20, paddingTop: 10, gap: 16, overflow: 'hidden' },
  grabber: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3 },
  row: { flexDirection: 'row', gap: 16, alignItems: 'stretch' },
  info: { flex: 1, gap: 10, justifyContent: 'flex-start' },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto' },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 },
});
