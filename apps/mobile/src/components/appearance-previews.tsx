import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { HereMark } from '@/components/here-mark';
import { Backdrops, type BackdropVariant } from '@/constants/theme';
import type { AppearanceMode } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

const LABEL: Record<AppearanceMode, string> = { system: 'Sistem', light: 'Açık', dark: 'Koyu' };
const W = 84;
const H = 148;

/**
 * Görünüm seçimi için mini ekran önizlemeleri (iOS Ayarlar › Ekran ve Parlaklık gibi). Her önizleme
 * gerçek zemin gradyanını ve cam kartları küçültülmüş gösterir; "Sistem" yarı açık, yarı koyu.
 */
export function AppearancePreviews({
  modes,
  selected,
  onSelect,
  variant,
}: {
  modes: AppearanceMode[];
  selected: AppearanceMode;
  onSelect: (mode: AppearanceMode) => void;
  variant: BackdropVariant;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, modes.length === 2 && styles.rowWide]}>
      {modes.map((mode) => {
        const active = mode === selected;
        return (
          <Pressable
            key={mode}
            onPress={() => onSelect(mode)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={LABEL[mode]}
            style={styles.item}>
            <View style={[styles.frame, { borderColor: active ? theme.accent : theme.separator }]}>
              {mode === 'system' ? (
                <>
                  <MiniScreen scheme="light" variant={variant} />
                  {/* Sağ yarı koyu: aynı ekranın koyu hâli, yalnızca sağ yarısı görünür. */}
                  <View style={styles.rightHalf}>
                    <View style={{ marginLeft: -W / 2 }}>
                      <MiniScreen scheme="dark" variant={variant} />
                    </View>
                  </View>
                </>
              ) : (
                <MiniScreen scheme={mode} variant={variant} />
              )}
            </View>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{LABEL[mode]}</Text>
            <Icon
              ios={active ? 'checkmark.circle.fill' : 'circle'}
              md={active ? 'check_circle' : 'radio_button_unchecked'}
              size={22}
              color={active ? theme.accent : theme.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

/** Küçültülmüş ana sayfa: zemin, HERE, iki cam kart ve sekme çubuğu. */
function MiniScreen({ scheme, variant }: { scheme: 'light' | 'dark'; variant: BackdropVariant }) {
  const card = scheme === 'dark' ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.62)';
  const line = scheme === 'dark' ? 'rgba(255, 255, 255, 0.28)' : 'rgba(11, 12, 16, 0.16)';
  return (
    <View style={[styles.screen, Backdrops[variant][scheme]]}>
      <HereMark height={11} />
      <View style={[styles.card, { backgroundColor: card }]}>
        <View style={[styles.line, { backgroundColor: line, width: '70%' }]} />
        <View style={[styles.photo, { backgroundColor: line }]} />
      </View>
      <View style={[styles.card, { backgroundColor: card }]}>
        <View style={[styles.line, { backgroundColor: line, width: '55%' }]} />
        <View style={[styles.line, { backgroundColor: line, width: '80%' }]} />
      </View>
      <View style={[styles.tabs, { backgroundColor: card }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowWide: { justifyContent: 'space-evenly' },
  item: { alignItems: 'center', gap: 8 },
  frame: { width: W + 4, height: H + 4, borderRadius: 18, borderWidth: 2, overflow: 'hidden', padding: 0 },
  rightHalf: { position: 'absolute', top: 0, bottom: 0, left: W / 2, width: W / 2, overflow: 'hidden' },
  screen: { width: W, height: H, padding: 8, gap: 6 },
  card: { borderRadius: 7, padding: 5, gap: 4 },
  line: { height: 4, borderRadius: 2 },
  photo: { height: 26, borderRadius: 4 },
  tabs: { position: 'absolute', left: 10, right: 10, bottom: 7, height: 12, borderRadius: 6 },
});
