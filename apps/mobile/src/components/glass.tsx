import { GlassContainer, GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { useTheme } from '@/hooks/use-theme';

/** Liquid Glass gerçekten kullanılabiliyor mu? (iOS 26+; eski iOS, Android ve web'de hayır) */
export const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

type GlassProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Varsayılan `clear`: net, şeffaf cam. `regular` daha buzlu ve okunaklı. */
  variant?: 'regular' | 'clear';
  /** Cama renk katar (ör. seçili çip). Cam yoksa opak zemin rengi olur. */
  tint?: ColorValue;
  /** Dokununca cam tepki verir (buton gibi davranan yüzeyler). */
  interactive?: boolean;
};

/**
 * Liquid Glass yüzeyi: yüzen kontroller (harita, sayaç, sohbet yazma alanı). "Saydamlığı Azalt"
 * açıksa ya da cam yoksa opak yüzeye düşer. Opaklık 1'in altına indirilmez (TASARIM.md §2.3).
 */
export function Glass({ children, style, variant = 'clear', tint, interactive }: GlassProps) {
  const theme = useTheme();
  const reduced = useReduceTransparency();
  if (!LIQUID_GLASS || reduced) {
    return (
      <View
        style={[
          { backgroundColor: tint ?? theme.surface, borderColor: theme.separator, borderWidth: StyleSheet.hairlineWidth },
          style,
        ]}>
        {children}
      </View>
    );
  }
  return (
    <GlassView glassEffectStyle={variant} tintColor={tint} isInteractive={interactive} style={style}>
      {children}
    </GlassView>
  );
}

/**
 * İçerik kartı: marka gradyanının üstünde buzlu cam (Klarna ve iOS Hava Durumu gibi). Kartın
 * içindeki fotoğraf ve metin opak kalır; açık modda hafif beyaz tonla okunurluk korunur.
 * `translucent`: daha geçirgen kart (paylaşımlar, T-17): net cam ve daha hafif ton, arkadaki
 * gradyan daha çok görünür.
 */
export function GlassCard({
  children,
  style,
  onPress,
  disabled,
  accessibilityLabel,
  accessibilityRole,
  translucent,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  translucent?: boolean;
  /** Verilirse kart dokunulabilir olur (basınca hafifçe solar). */
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const reduced = useReduceTransparency();
  const card =
    !LIQUID_GLASS || reduced ? (
      <View style={[{ backgroundColor: theme.surface }, style]}>{children}</View>
    ) : (
      <GlassView
        glassEffectStyle={translucent ? 'clear' : 'regular'}
        tintColor={translucent ? (dark ? 'rgba(255, 255, 255, 0.03)' : undefined) : dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.35)'}
        style={style}>
        {children}
      </GlassView>
    );
  if (!onPress) return card;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      {card}
    </Pressable>
  );
}

/** Birbirine yakın cam öğeleri tek grupta toplar; yaklaşınca birbirine akarlar. */
export function GlassGroup({ children, spacing = 10, style }: { children: ReactNode; spacing?: number; style?: StyleProp<ViewStyle> }) {
  if (!LIQUID_GLASS) return <View style={style}>{children}</View>;
  return (
    <GlassContainer spacing={spacing} style={style}>
      {children}
    </GlassContainer>
  );
}
