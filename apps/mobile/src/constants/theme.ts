/**
 * HERE renk sistemi.
 *
 * Marka renkleri: Winter Haze #D9DEE5 ve Wild Fuchsia #E11D49. Koyu modda siyah + fuşya.
 *
 * Roller:
 *   accent       → marka fuşyası; DOLGU olarak (birincil buton, gönder, anahtar, nokta)
 *   onAccent     → fuşya dolgu üzerindeki metin/ikon
 *   accentInk    → fuşya renkli METİN/ikon. Küçük yazıda 4.5:1 kontrast için açık modda bir
 *                  ton koyu, koyu modda bir ton açık. (#E11D49 küçük yazıda Winter Haze
 *                  üzerinde ≈3.5:1, siyah üzerinde ≈4.5:1'in altında kalıyor.)
 *   accentSoft   → fuşya tonlu zemin (rozet, sayaç)
 *   background   → zeminin taban rengi (tam beyaz / tam siyah); üstünde marka gradyanı (Backdrop)
 *   surface      → camın kullanılamadığı yerde opak kart · fill → cam kartın içindeki yarı saydam dolgu
 *   backgroundElement → çip, giriş alanı, segment, ikincil buton (açık modda Winter Haze'in kendisi)
 *   inverseText  → metin renginde dolgu üstündeki yazı (ör. "Takip et", T-7)
 *
 * Zemin her ekranda Klarna tarzı yumuşak marka gradyanıdır (Backdrop). Kartlar bu gradyanın
 * üstünde Liquid Glass'tır (components/glass.tsx). Fuşya metin cam üstünde kullanılmaz; tek
 * istisna sistemin çizdiği seçili sekme rengi (T-2).
 */

import '@/global.css';

import { Platform, type ViewStyle } from 'react-native';

export const Brand = {
  winterHaze: '#D9DEE5',
  wildFuchsia: '#E11D49',
} as const;

export const Colors = {
  light: {
    text: '#0B0C10',
    // Güçlü gradyanın üst bandında da 4.5:1 (T-18); beyaz üstünde 8.5:1.
    textSecondary: '#474D59',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    fill: 'rgba(120, 120, 128, 0.12)',
    backgroundElement: Brand.winterHaze,
    backgroundSelected: '#C6CDD7',
    segmentActive: '#FFFFFF',
    separator: '#D9DEE5',
    accent: Brand.wildFuchsia,
    onAccent: '#FFFFFF',
    accentInk: '#C4123F',
    accentSoft: '#FCE4EA',
    inverseText: '#FFFFFF',
    success: '#2B8A3E',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#9EA3AD',
    background: '#000000',
    surface: '#121214',
    fill: 'rgba(120, 120, 128, 0.24)',
    backgroundElement: '#1F2024',
    backgroundSelected: '#2C2D32',
    segmentActive: '#3A3B41',
    separator: '#26272B',
    accent: Brand.wildFuchsia,
    onAccent: '#FFFFFF',
    accentInk: '#FF4F79',
    accentSoft: '#3D0F1C',
    inverseText: '#000000',
    success: '#69DB7C',
  },
} as const;

type Glow = { color: string; x: string; y: string; width: string; height: string };

/** Yumuşak radyal ışık: merkezde renk, kenara doğru tamamen saydam. */
const glow = ({ color, x, y, width, height }: Glow) =>
  ({
    type: 'radial-gradient',
    shape: 'ellipse',
    size: { x: width, y: height },
    position: { top: y, left: x },
    colorStops: [
      { color, positions: ['0%'] },
      { color: color.replace(/[\d.]+\)$/, '0)'), positions: ['100%'] },
    ],
  }) as const;

/** Geniş renk yıkaması: yukarıdan aşağı yumuşak geçiş (Revolut'un siyah-mavi zemini gibi). */
const wash = (stops: [string, string][]) =>
  ({
    type: 'linear-gradient',
    direction: 'to bottom',
    colorStops: stops.map(([color, position]) => ({ color, positions: [position] })),
  }) as const;

/** Zemin denemeleri (T-18): kurucuyla birlikte denenip biri seçilecek. */
export type BackdropVariant = 'ust' | 'kose' | 'genis';

/** Üst ışıklar: sol üstte fuşya, sağ üstte soğuk mavi-lavanta, ortanın üstünde pembe. */
const TOP = {
  light: [
    glow({ color: 'rgba(225, 29, 73, 0.34)', x: '6%', y: '0%', width: '100%', height: '50%' }),
    glow({ color: 'rgba(110, 130, 220, 0.42)', x: '98%', y: '2%', width: '90%', height: '44%' }),
    glow({ color: 'rgba(255, 140, 180, 0.40)', x: '45%', y: '22%', width: '85%', height: '32%' }),
  ],
  dark: [
    glow({ color: 'rgba(225, 29, 73, 0.46)', x: '5%', y: '0%', width: '100%', height: '48%' }),
    glow({ color: 'rgba(95, 105, 190, 0.36)', x: '96%', y: '4%', width: '85%', height: '40%' }),
    glow({ color: 'rgba(150, 20, 75, 0.30)', x: '45%', y: '22%', width: '80%', height: '30%' }),
  ],
};

/** Sağ alt köşe: mavi-lavanta ışık ve hafif fuşya; alt kısımdaki kartlar da renk alır. */
const CORNER = {
  light: [
    glow({ color: 'rgba(110, 130, 220, 0.55)', x: '100%', y: '100%', width: '120%', height: '62%' }),
    glow({ color: 'rgba(225, 29, 73, 0.26)', x: '70%', y: '100%', width: '80%', height: '36%' }),
  ],
  dark: [
    glow({ color: 'rgba(70, 90, 210, 0.55)', x: '100%', y: '100%', width: '120%', height: '62%' }),
    glow({ color: 'rgba(225, 29, 73, 0.30)', x: '70%', y: '100%', width: '80%', height: '36%' }),
  ],
};

/**
 * Marka zemini (Klarna tarzı, TASARIM.md §3.6). Tabanı tam beyaz / tam siyah; üstünde radyal
 * ışıklar. Ekranların zemininde sabit durur; cam kartlar bu rengi kırarak gösterir.
 * - `ust`: yalnız üstte ışık · `kose`: üst + sağ alt · `genis`: ekranın çoğunu kaplayan yıkama
 */
export const Backdrops: Record<BackdropVariant, Record<'light' | 'dark', ViewStyle>> = {
  ust: {
    light: { backgroundColor: '#FFFFFF', experimental_backgroundImage: TOP.light },
    dark: { backgroundColor: '#000000', experimental_backgroundImage: TOP.dark },
  },
  kose: {
    light: { backgroundColor: '#FFFFFF', experimental_backgroundImage: [...TOP.light, ...CORNER.light] },
    dark: { backgroundColor: '#000000', experimental_backgroundImage: [...TOP.dark, ...CORNER.dark] },
  },
  genis: {
    light: {
      backgroundColor: '#FFFFFF',
      experimental_backgroundImage: [
        glow({ color: 'rgba(225, 29, 73, 0.30)', x: '0%', y: '0%', width: '110%', height: '55%' }),
        glow({ color: 'rgba(90, 115, 230, 0.34)', x: '100%', y: '45%', width: '100%', height: '60%' }),
        wash([
          ['#FFE3EC', '0%'],
          ['#ECE8FF', '55%'],
          ['#FFFFFF', '100%'],
        ]),
      ],
    },
    dark: {
      backgroundColor: '#000000',
      experimental_backgroundImage: [
        glow({ color: 'rgba(225, 29, 73, 0.38)', x: '0%', y: '0%', width: '110%', height: '50%' }),
        glow({ color: 'rgba(60, 90, 230, 0.42)', x: '100%', y: '40%', width: '110%', height: '65%' }),
        wash([
          ['#1A0E2C', '0%'],
          ['#0A1238', '50%'],
          ['#000000', '100%'],
        ]),
      ],
    },
  },
};

/** Varsayılan zemin; ekranlar `useBackdrop()` ile seçili denemeyi kullanır. */
export const Backdrop = Backdrops.ust;

/** iOS Dynamic Type ölçeği (TASARIM.md §4). Metinler kullanıcının yazı boyutu ayarıyla büyür. */
export const Type = {
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: 0.4 },
  title2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  title3: { fontSize: 20, fontWeight: '600', letterSpacing: -0.2 },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22 },
  subheadline: { fontSize: 15, lineHeight: 20 },
  footnote: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12 },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Yazı tipi her yerde DM Sans (T-16). Adlar expo-font takma adlarıdır; `src/app/_layout.tsx`
 * açılışta yükler. RN metinleri `@/components/text` ile ağırlığa uygun dosyayı kendiliğinden alır.
 */
export const Fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  extrabold: 'DMSans_800ExtraBold',
  /** Yalnızca şablon bileşenlerindeki kod örnekleri için eş aralıklı sistem yazısı. */
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
} as const;

/** Başlık çubuğu yazıları: yığınların `screenOptions`'ı için. */
export const HeaderFonts = {
  headerTitleStyle: { fontFamily: Fonts.semibold },
  headerLargeTitleStyle: { fontFamily: Fonts.bold },
} as const;

/** `Stack.Title` kendi stilini yazdığı için ekranda başlık verilen her yere ayrıca bunlar geçilir. */
export const TitleFonts = { style: { fontFamily: Fonts.semibold }, largeStyle: { fontFamily: Fonts.bold } } as const;

/** Aynı dosyaların PostScript adları: SwiftUI denetimleri (`font({ family })`) bunlarla bulur. */
export const NativeFonts = {
  regular: 'DMSans-Regular',
  medium: 'DMSans-Medium',
  semibold: 'DMSans-SemiBold',
  bold: 'DMSans-Bold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
