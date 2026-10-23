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
  useScrollOffset,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { HereMark } from '@/components/here-mark';
import { HERE_SPRITE } from '@/components/here-mark-sprite';

/** Bir tam tur için çekme mesafesi (pt); iOS'un yenileme eşiğine yakın. */
const PULL_FOR_TURN = 110;
/** Yenilerken bir tur süresi (ms). */
const TURN_MS = 900;
/** Dönüş hızı (derece/ms). */
const SPIN_SPEED = 360 / TURN_MS;
/** Prototipte veri sunucudan gelmiyor; logo en az bu kadar döner, sonra yavaşlayıp durur. */
const MIN_REFRESH_MS = 1000;
/** Logo öne bakmadan önceki son bu kadar açıda frenler; öncesinde aynı hızla döner. */
const BRAKE_DEG = 60;
/** Logo karesi bu açıda bir değişir (60 kare). */
const FRAME_DEG = 360 / HERE_SPRITE.frames;
/** İçerik, logonun son karesinden bu kadar önce yerine dönmeye başlar: ikisinin arasında donmuş bir an kalmaz
 * (geliştirme sürümünde JS'ten iOS'un içeriği geri kaydırmaya başlamasına kadar ~250 ms geçiyor). */
const RETURN_LEAD_MS = 260;
const MARK_HEIGHT = 34;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Aşağı çekip yenileme (TASARIM.md T-24): iOS'un dönen çarkı gizli; yerine balon HERE logosu çekilen
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

  // Başlıksız ekranda kaydırma, durum çubuğu kadar yukarıda durur (-insets.top). Yalnızca değişince yazılır:
  // normal kaydırmada 0'da kalır, ona bağlı logo ve kapak her karede yeniden işlenmez.
  const pull = useSharedValue(0);
  useAnimatedReaction(
    () => Math.max(0, -insets.top - offset.get()),
    (distance, previous) => {
      if (distance !== previous) pull.set(distance);
    },
  );

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

    // Bitince logo öne bakana dek aynı hızla döner, son BRAKE_DEG'de düzgünce frenleyip durur. Ease-out quad'ın başlangıç
    // hızı ortalamanın iki katı; fren süresi 2·BRAKE_DEG/hız seçilince hız kesintisiz sürer (ani hızlanma ya da sert fren
    // yok, uzun "neredeyse durmuş" bir kuyruk da yok). Açı UI iş parçacığında okunur.
    scheduleOnUI(() => {
      'worklet';
      cancelAnimation(angle);
      const now = angle.get();
      let delta = Math.ceil(now / 360) * 360 - now;
      if (delta < BRAKE_DEG) delta += 360;
      const cruise = (delta - BRAKE_DEG) / SPIN_SPEED;
      const brake = (2 * BRAKE_DEG) / SPIN_SPEED;
      angle.set(
        withSequence(
          withTiming(now + delta - BRAKE_DEG, { duration: cruise, easing: Easing.linear }),
          withTiming(now + delta, { duration: brake, easing: Easing.out(Easing.quad) }, () => {
            angle.set(0);
            spinning.set(false);
          }),
        ),
      );
      // Kare en yakın açıya yuvarlanır: kalan açı yarım karenin altına inince logo gözle durmuş görünür
      // (quad: kalan = BRAKE_DEG·(1−t/T)²). İçerik o andan biraz önce dönmeye başlar.
      const lastFrameAt = cruise + brake * (1 - Math.sqrt(FRAME_DEG / 2 / BRAKE_DEG));
      scheduleOnRN(endRefreshingIn, lastFrameAt - RETURN_LEAD_MS);
    });
  };

  // İçerik, logo durmadan biraz önce yerine dönmeye başlar.
  const endRefreshingIn = (ms: number) => setTimeout(() => setRefreshing(false), Math.max(0, ms));

  // Çark saydam: yalnızca iOS'un çekme davranışı (eşik, içerik boşluğu) kullanılır.
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={start} tintColor="transparent" />;
  return { ref, refreshControl, angle, pull, offset };
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
