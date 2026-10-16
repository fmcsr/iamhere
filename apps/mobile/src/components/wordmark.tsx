import Svg, { Path } from 'react-native-svg';

import { WORDMARK_PATH, WORDMARK_VIEWBOX } from '@/components/wordmark-path';

/** HERE logosu (vektör). Kaynak: scripts/generate-brand.py */
export function Wordmark({ height = 24, color }: { height?: number; color: string }) {
  const { width: vw, height: vh } = WORDMARK_VIEWBOX;
  return (
    <Svg
      width={(height * vw) / vh}
      height={height}
      viewBox={`0 0 ${vw} ${vh}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel="HERE">
      <Path d={WORDMARK_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  );
}
