import { useState } from 'react';
import { RefreshControl, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useScrollOffset,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HereMark } from '@/components/here-mark';

/** Bir tam tur için çekme mesafesi (pt); iOS'un yenileme eşiğine yakın. */
const PULL_FOR_TURN = 110;
/** Yenilerken bir tur süresi (ms). */
const TURN_MS = 900;
/** Prototipte veri sunucudan gelmiyor; yenileme bu kadar sürer. */
const MIN_REFRESH_MS = 1400;
const MARK_HEIGHT = 34;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Aşağı çekip yenileme (TASARIM.md T-24): iOS'un dönen çarkı gizli; yerine krom HERE logosu çekilen
 * mesafe kadar döner, yenilerken soldan sağa dönmeye devam eder, bitince turunu tamamlayıp öne bakarak
 * durur. Başlıksız ekranlar içindir; kaydırma görünümü `Animated.ScrollView` olmalı (`ref` ve
 * `refreshControl` buradan). Logo ya ekranın kendi HERE yazısıdır (ana sayfa) ya da `HereRefreshIndicator`.
 */
export function useHereRefresh(onRefresh?: () => Promise<unknown> | void) {
  const insets = useSafeAreaInsets();
  const ref = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(ref);
  const angle = useSharedValue(0);
  const spinning = useSharedValue(false);
  // Yenileme bitince içerik yerine oturana kadar çekme logoyu yeniden çevirmez (sıçrama olmasın).
  const armed = useSharedValue(true);
  const [refreshing, setRefreshing] = useState(false);

  // Başlıksız ekranda kaydırma, durum çubuğu kadar yukarıda durur (-insets.top).
  const pull = useDerivedValue(() => Math.max(0, -insets.top - offset.get()));

  useAnimatedReaction(
    () => pull.get(),
    (distance) => {
      if (spinning.get()) return;
      if (!armed.get()) {
        if (distance < 1) armed.set(true);
        return;
      }
      angle.set(Math.min(distance / PULL_FOR_TURN, 1) * 360);
    },
  );

  const start = async () => {
    setRefreshing(true);
    spinning.set(true);
    armed.set(false);
    const from = angle.get();
    angle.set(withRepeat(withTiming(from + 360, { duration: TURN_MS, easing: Easing.linear }), -1, false));
    await Promise.all([onRefresh?.(), wait(MIN_REFRESH_MS)]);

    // Turu tamamla, öne bakarak dur; sonra içerik yerine döner.
    cancelAnimation(angle);
    const now = angle.get();
    const target = (Math.floor(now / 360) + 1) * 360;
    const duration = ((target - now) / 360) * TURN_MS * 1.6;
    angle.set(
      withTiming(target, { duration, easing: Easing.out(Easing.cubic) }, () => {
        angle.set(0);
        spinning.set(false);
      }),
    );
    await wait(duration);
    setRefreshing(false);
  };

  // Çark saydam: yalnızca iOS'un çekme davranışı (eşik, içerik boşluğu) kullanılır.
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={start} tintColor="transparent" />;
  return { ref, refreshControl, angle, pull };
}

/** Çekince açılan boşlukta, durum çubuğunun altında dönen logo. */
export function HereRefreshIndicator({ pull, angle }: { pull: SharedValue<number>; angle: SharedValue<number> }) {
  const insets = useSafeAreaInsets();
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pull.get(), [14, 46], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: Math.max(0, (pull.get() - MARK_HEIGHT) / 2) },
      { scale: interpolate(pull.get(), [14, 70], [0.6, 1], Extrapolation.CLAMP) },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.indicator, { top: insets.top }, style]}>
      <HereMark height={MARK_HEIGHT} angle={angle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  indicator: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
