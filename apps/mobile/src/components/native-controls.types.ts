import type { StyleProp, ViewStyle } from 'react-native';

import type { SFSymbolName } from '@/components/icon';

/**
 * - `glassProminent`: içeriğin üstünde yüzen birincil eylem (fuşya cam). Ekran başına bir tane.
 * - `glass`: yüzen ikincil eylem.
 * - `filled`: içerikte birincil eylem (dolu).
 * - `tonal`: içerikte ikincil eylem (gri).
 */
export type ActionButtonVariant = 'glassProminent' | 'glass' | 'filled' | 'tonal';

export type ActionButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ActionButtonVariant;
  /** SF Symbol; yalnızca iOS'ta gösterilir. */
  systemImage?: SFSymbolName;
  size?: 'regular' | 'large';
  fullWidth?: boolean;
  /** Dolgu rengi (varsayılan fuşya). T-7: "Takip et" metin renginde dolgu kullanır. */
  color?: string;
  /** Dolgu üstündeki yazının rengi; `color` verildiğinde kullanılır. */
  labelColor?: string;
  disabled?: boolean;
  destructive?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export type SegmentedPickerProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};
