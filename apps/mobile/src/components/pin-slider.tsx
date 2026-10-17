import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';

const TRACK_W = 76;
const TRACK_H = 236;
const KNOB = 62;
const INSET = 7;
/** Topuzun gidebileceği yol. */
const TRAVEL = TRACK_H - KNOB - INSET * 2;
/** Bu kadar aşağı inince bırakılsa da iğnelenir. */
const DONE_AT = 0.8;

/**
 * Yer bildirme kaydırıcısı (TASARIM.md T-26, Luma'nın "Slide to Confirm"ı gibi ama dikey): fuşya
 * oluğun tepesindeki iğne aşağı kaydırılır; dibe varınca zemine saplanır, halka yayılır ve
 * `onPinned` çağrılır. İğne zemindeki elipsin üstünde durunca HERE'nin yer bildirme simgesi
 * (mappin.and.ellipse) tamamlanır ve öyle kalır. `locked` (mekân uzak): gri, kilitli, kıpırdamaz.
 */
export function PinSlider({ locked, onPinned }: { locked: boolean; onPinned: () => void }) {
  const enabled = !locked;
  const theme = useTheme();
  const y = useSharedValue(0);
  const pinned = useSharedValue(0);
  const hint = useSharedValue(0);

  useEffect(() => {
    if (enabled) hint.set(withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1, false));
  }, [enabled, hint]);

  // Topuzu dibe oturtur, iğneyi zemine saplar.
  const pin = () => {
    'worklet';
    y.set(withSpring(TRAVEL, { damping: 15, stiffness: 240 }));
    pinned.set(withDelay(90, withTiming(1, { duration: 560, easing: Easing.out(Easing.back(2.2)) })));
  };

  const pan = usePanGesture({
    enabled,
    activeOffsetY: [-6, 6],
    onUpdate: (event) => {
      'worklet';
      if (pinned.get() > 0) return;
      y.set(Math.min(Math.max(event.translationY, 0), TRAVEL));
    },
    onDeactivate: () => {
      'worklet';
      if (pinned.get() > 0) return;
      if (y.get() >= TRAVEL * DONE_AT) {
        pin();
        scheduleOnRN(onPinned);
      }
      else y.set(withSpring(0, { damping: 17, stiffness: 210 }));
    },
  });

  // Topuz: aşağı iner; iğnelenince küçülüp kaybolur, yerinde zemine saplanmış beyaz iğne kalır.
  const knob = useAnimatedStyle(() => ({
    opacity: interpolate(pinned.get(), [0, 0.35], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: y.get() }, { scale: interpolate(pinned.get(), [0, 0.35], [1, 0.7], Extrapolation.CLAMP) }],
  }));
  const trail = useAnimatedStyle(() => ({ height: INSET + KNOB / 2 + y.get() }));
  const standing = useAnimatedStyle(() => ({
    opacity: interpolate(pinned.get(), [0.05, 0.3], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(pinned.get(), [0, 1], [-22, 0]) }],
  }));
  const ripple = useAnimatedStyle(() => ({
    opacity: interpolate(pinned.get(), [0.55, 0.7, 1], [0, 0.9, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(pinned.get(), [0.55, 1], [1, 2.6], Extrapolation.CLAMP) }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[styles.track, { backgroundColor: enabled ? theme.accent : theme.fill }]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={enabled ? 'Yer bildir: iğneyi aşağı kaydır' : 'Yer bildirme kapalı: mekân çok uzakta'}
        accessibilityActions={enabled ? [{ name: 'activate', label: 'Yer bildir' }] : []}
        onAccessibilityAction={() => {
          pin();
          onPinned();
        }}>
        {enabled && (
          <>
            <LinearGradient colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.12)']} style={StyleSheet.absoluteFill} />
            <Animated.View style={[styles.trail, trail]} />
            {[0, 1, 2].map((i) => (
              <Chevron key={i} index={i} hint={hint} y={y} />
            ))}
          </>
        )}

        {/* Zemin: iğnenin saplanacağı elips; iğnelenince halka yayılır. */}
        <View style={styles.groundWrap} pointerEvents="none">
          <Animated.View style={[styles.ripple, ripple]} />
          <View style={[styles.ground, { backgroundColor: enabled ? 'rgba(255,255,255,0.55)' : theme.separator }]} />
        </View>
        <Animated.View style={[styles.standing, standing]} pointerEvents="none">
          <SymbolView name="mappin" size={38} weight="bold" tintColor="#fff" />
        </Animated.View>

        <Animated.View style={[styles.knob, { backgroundColor: enabled ? '#fff' : theme.surface }, knob]}>
          {enabled ? (
            <SymbolView name="mappin" size={32} weight="bold" tintColor={theme.accent} />
          ) : (
            <Icon ios="lock.fill" md="lock" size={20} color={theme.textSecondary} />
          )}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

/** Aşağıyı gösteren ışıltılı oklar; topuz indikçe söner. */
function Chevron({ index, hint, y }: { index: number; hint: SharedValue<number>; y: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const phase = (hint.get() + 1 - index / 3) % 1;
    const glow = interpolate(phase, [0, 0.5, 1], [0.25, 1, 0.25]);
    return { opacity: glow * interpolate(y.get(), [0, TRAVEL * 0.6], [1, 0], Extrapolation.CLAMP) };
  });
  return (
    <Animated.View style={[styles.chevron, { top: INSET + KNOB + 18 + index * 22 }, style]} pointerEvents="none">
      <Icon ios="chevron.down" md="expand_more" size={16} color="#fff" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: { width: TRACK_W, height: TRACK_H, borderRadius: TRACK_W / 2, overflow: 'hidden', alignItems: 'center' },
  trail: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.16)' },
  chevron: { position: 'absolute', alignSelf: 'center' },
  knob: {
    position: 'absolute',
    top: INSET,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  groundWrap: { position: 'absolute', bottom: INSET + 2, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleY: 0.32 }] },
  ground: { width: 34, height: 34, borderRadius: 17 },
  ripple: { position: 'absolute', width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: '#fff' },
  // İğnenin ucu elipsin ortasına değer.
  standing: { position: 'absolute', bottom: INSET + 18, alignSelf: 'center' },
});
