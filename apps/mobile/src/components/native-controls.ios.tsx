import { Button, Host, Label, Picker, Text } from '@expo/ui/swift-ui';
import {
  accessibilityLabel as accessibilityLabelModifier,
  buttonStyle,
  controlSize,
  disabled as disabledModifier,
  font,
  foregroundStyle,
  frame,
  pickerStyle,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import SegmentedControlBase, { type SegmentedControlProps } from '@react-native-segmented-control/segmented-control';
import type { ComponentType } from 'react';

import { LIQUID_GLASS } from '@/components/glass';
import type { ActionButtonProps, SegmentedPickerProps } from '@/components/native-controls.types';
import { NativeFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Paketin sınıf tipleri React 19 tipleriyle uyuşmuyor; bileşen aynı, yalnızca tip düzeltiliyor.
const SegmentedControl = SegmentedControlBase as unknown as ComponentType<SegmentedControlProps>;

// iOS 26 öncesinde cam stilleri yok; en yakın klasik stile düşülür.
const BUTTON_STYLE = {
  glassProminent: LIQUID_GLASS ? 'glassProminent' : 'borderedProminent',
  glass: LIQUID_GLASS ? 'glass' : 'bordered',
  filled: 'borderedProminent',
  tonal: 'bordered',
} as const;

/** SwiftUI butonu: iOS 26+ Liquid Glass stilleri, dokunma tepkisi ve Dynamic Type dahil. */
export function ActionButton({
  title,
  onPress,
  variant = 'filled',
  systemImage,
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
  const modifiers = [
    buttonStyle(BUTTON_STYLE[variant]),
    controlSize(size),
    tint(prominent ? (color ?? theme.accent) : theme.text),
    ...(disabled ? [disabledModifier(true)] : []),
    ...(accessibilityLabel ? [accessibilityLabelModifier(accessibilityLabel)] : []),
  ];
  const labelModifiers = [
    // DM Sans (T-16); textStyle sayesinde Dynamic Type ile büyür.
    font({ family: NativeFonts.semibold, size: size === 'large' ? 17 : 15, textStyle: size === 'large' ? 'body' : 'subheadline' }),
    ...(fullWidth ? [frame({ maxWidth: 10_000 })] : []),
    ...(prominent && labelColor ? [foregroundStyle(labelColor)] : []),
  ];
  return (
    <Host matchContents={fullWidth ? { vertical: true } : true} style={[fullWidth && { alignSelf: 'stretch' }, style]}>
      <Button onPress={onPress} role={destructive ? 'destructive' : undefined} modifiers={modifiers}>
        {systemImage ? (
          <Label title={title} systemImage={systemImage} modifiers={labelModifiers} />
        ) : (
          <Text modifiers={labelModifiers}>{title}</Text>
        )}
      </Button>
    </Host>
  );
}

const OPTION_FONT = font({ family: NativeFonts.medium, size: 15, textStyle: 'subheadline' });

/** Dokununca seçenekleri açılır menüde gösteren yerel seçici (ör. paylaşımda "Kim görebilir"). */
export function MenuPicker<T extends string>({ options, value, onChange, style }: SegmentedPickerProps<T>) {
  const theme = useTheme();
  return (
    <Host matchContents style={style}>
      <Picker<string>
        selection={value}
        onSelectionChange={(selection) => onChange(selection as T)}
        modifiers={[pickerStyle('menu'), tint(theme.text), OPTION_FONT]}>
        {options.map((option) => (
          <Text key={option.value} modifiers={[tag(option.value), OPTION_FONT]}>
            {option.label}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}

/**
 * Yerel segment denetimi (T-4): iOS'un kendi UISegmentedControl'ü, iOS 26+ cam seçim göstergesiyle.
 * SwiftUI segmentli seçici özel yazı tipi almadığı için bu denetim kullanılıyor: yazı DM Sans (T-16).
 */
export function SegmentedPicker<T extends string>({ options, value, onChange, style, accessibilityLabel }: SegmentedPickerProps<T>) {
  const theme = useTheme();
  return (
    <SegmentedControl
      values={options.map((option) => option.label)}
      selectedIndex={Math.max(0, options.findIndex((option) => option.value === value))}
      onChange={(event) => onChange(options[event.nativeEvent.selectedSegmentIndex].value)}
      fontStyle={{ fontFamily: NativeFonts.medium, fontSize: 14, color: theme.text }}
      activeFontStyle={{ fontFamily: NativeFonts.semibold, fontSize: 14, color: theme.text }}
      accessibilityLabel={accessibilityLabel}
      style={[{ alignSelf: 'stretch', height: 36 }, style]}
    />
  );
}
