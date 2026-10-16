import { createContext, use, type ComponentPropsWithRef } from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { Fonts } from '@/constants/theme';

/** fontWeight → yüklenen DM Sans dosyası. İnce ağırlıklar (100–300) yüklenmedi, normale düşer. */
export function fontFor(weight?: TextStyle['fontWeight']): string {
  switch (String(weight ?? '400')) {
    case '500':
    case 'medium':
      return Fonts.medium;
    case '600':
    case 'semibold':
      return Fonts.semibold;
    case '700':
    case 'bold':
    case 'condensedBold':
      return Fonts.bold;
    case '800':
    case '900':
    case 'heavy':
    case 'black':
      return Fonts.extrabold;
    default:
      return Fonts.regular;
  }
}

/** İç içe metin: kendi ağırlığı yoksa üstteki metnin yazısını miras alsın diye. */
const InsideText = createContext(false);

/**
 * Stilde yazı ailesi yoksa ağırlığa uygun DM Sans dosyasını koyar ve fontWeight'i kaldırır
 * (dosya ağırlığı zaten taşıyor; ayrıca kalınlık istenirse sistem sahte kalınlık üretir).
 */
function withFont(style: StyleProp<TextStyle>, nested: boolean): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (flat?.fontFamily || (nested && flat?.fontWeight == null)) return style;
  const { fontWeight, ...rest } = flat ?? {};
  return { ...rest, fontFamily: fontFor(fontWeight) };
}

/** React Native `Text`, her zaman DM Sans (T-16). Uygulamadaki tüm metinler bunu kullanır. */
export function Text({ style, children, ...props }: ComponentPropsWithRef<typeof RNText>) {
  const nested = use(InsideText);
  return (
    <RNText {...props} style={withFont(style, nested)}>
      {nested ? children : <InsideText value>{children}</InsideText>}
    </RNText>
  );
}

/** React Native `TextInput`, her zaman DM Sans. */
export function TextInput({ style, ...props }: ComponentPropsWithRef<typeof RNTextInput>) {
  return <RNTextInput {...props} style={withFont(style, false)} />;
}
