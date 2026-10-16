// Android ve web için karşılıklar. iOS sürümü: native-controls.ios.tsx (SwiftUI).
import { Pressable, StyleSheet, View } from 'react-native';

import type { ActionButtonProps, SegmentedPickerProps } from '@/components/native-controls.types';
import { Text } from '@/components/text';
import { useTheme } from '@/hooks/use-theme';

export function ActionButton({
  title,
  onPress,
  variant = 'filled',
  size = 'large',
  fullWidth,
  color,
  labelColor,
  disabled,
  destructive,
  accessibilityLabel,
  style,
}: ActionButtonProps) {
  const theme = useTheme();
  const prominent = variant === 'filled' || variant === 'glassProminent';
  const background = prominent ? (color ?? theme.accent) : theme.backgroundElement;
  const foreground = prominent ? (labelColor ?? theme.onAccent) : destructive ? '#D92D20' : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'large' ? styles.large : styles.regular,
        { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' },
        style,
      ]}>
      <Text style={{ color: foreground, fontWeight: '600', fontSize: size === 'large' ? 17 : 15 }}>{title}</Text>
    </Pressable>
  );
}

export function SegmentedPicker<T extends string>({ options, value, onChange, accessibilityLabel, style }: SegmentedPickerProps<T>) {
  const theme = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={[styles.segmented, { backgroundColor: theme.backgroundElement }, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && { backgroundColor: theme.segmentActive }]}>
            <Text style={{ color: active ? theme.text : theme.textSecondary, fontWeight: '600', fontSize: 14 }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Android/web'de menü yerine segment gösterilir. */
export function MenuPicker<T extends string>(props: SegmentedPickerProps<T>) {
  return <SegmentedPicker {...props} />;
}

const styles = StyleSheet.create({
  button: { borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  large: { height: 50 },
  regular: { height: 36 },
  segmented: { flexDirection: 'row', padding: 3, borderRadius: 999 },
  segment: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
});
