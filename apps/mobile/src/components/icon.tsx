import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type SymbolName = ComponentProps<typeof SymbolView>['name'];
/** SF Symbol adı (iOS). */
export type SFSymbolName = Extract<SymbolName, string>;
type MaterialName = NonNullable<Exclude<SymbolName, string>['android']>;

type IconProps = {
  /** SF Symbol (iOS) */
  ios: SFSymbolName;
  /** Material Symbol (Android + web) */
  md: MaterialName;
  size?: number;
  color: ColorValue;
};

export function Icon({ ios, md, size = 20, color }: IconProps) {
  return <SymbolView name={{ ios, android: md, web: md }} size={size} tintColor={color} />;
}
