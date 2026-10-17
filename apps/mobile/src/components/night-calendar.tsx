import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { SectionTitle } from '@/components/profile-sections';
import { Text } from '@/components/text';
import { Radius, Type } from '@/constants/theme';
import type { Venue } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';
import { MONTHS, WEEKDAYS_SHORT, dayNumber, keyOf, longDate, monthLayout, tonightKey, type Night } from '@/lib/nights';

const GAP = 6;

/**
 * Gece takvimi (BeReal'in takvimi gibi): dışarıda olunan gecelerde o gecenin fotoğrafı küçük bir kare,
 * bu gece fuşya çerçeveli. Bir güne dokununca altta o gecenin özeti açılır. Aylar arasında geçilebilir.
 */
export function NightCalendar({
  title = 'Gecelerin',
  nights,
  venueById,
  photoOf,
  detailOf,
  onOpenNight,
  privacy,
}: {
  title?: string;
  nights: Night[];
  venueById: (id: string) => Venue | undefined;
  photoOf: (night: Night) => string | undefined;
  /** Seçili gecenin alt satırı (ör. "2 paylaşım · Deniz de oradaydı"). */
  detailOf: (night: Night) => string;
  onOpenNight: (night: Night) => void;
  /** Kimlerin gördüğünü anlatan küçük etiket; dokununca ayarlara gider. */
  privacy?: { label: string; onPress?: () => void };
}) {
  const theme = useTheme();
  const today = tonightKey();
  const [ty, tm] = today.split('-').map(Number);
  const [month, setMonth] = useState({ year: ty, month: tm - 1 });
  const [selected, setSelected] = useState<string | undefined>(nights[0]?.key);
  const [width, setWidth] = useState(0);

  const byKey = new Map(nights.map((n) => [n.key, n]));
  const { offset, days } = monthLayout(month.year, month.month);
  const isCurrentMonth = month.year === ty && month.month === tm - 1;
  const cell = width > 0 ? Math.floor((width - GAP * 6) / 7) : 0;
  const shift = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const next = new Date(Date.UTC(year, m + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });

  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
  const selectedNight = selected ? byKey.get(selected) : undefined;
  const monthNights = nights.filter((n) => n.key.startsWith(keyOf(month.year, month.month, 1).slice(0, 7))).length;

  return (
    <View style={styles.wrap}>
      <SectionTitle
        title={title}
        right={
          <View style={styles.monthNav}>
            <Pressable onPress={() => shift(-1)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Önceki ay">
              <Icon ios="chevron.left" md="chevron_left" size={15} color={theme.text} />
            </Pressable>
            <Text style={[Type.subheadline, styles.monthLabel, { color: theme.text }]}>
              {MONTHS[month.month]} {month.year}
            </Text>
            <Pressable
              onPress={() => !isCurrentMonth && shift(1)}
              hitSlop={10}
              disabled={isCurrentMonth}
              accessibilityRole="button"
              accessibilityLabel="Sonraki ay">
              <Icon ios="chevron.right" md="chevron_right" size={15} color={isCurrentMonth ? theme.separator : theme.text} />
            </Pressable>
          </View>
        }
      />
      {privacy && (
        <Pressable onPress={privacy.onPress} disabled={!privacy.onPress} style={[styles.privacy, { backgroundColor: theme.fill }]} accessibilityRole="button">
          <Icon ios="lock.fill" md="lock" size={11} color={theme.textSecondary} />
          <Text style={[Type.caption, { color: theme.textSecondary, fontWeight: '600' }]}>{privacy.label}</Text>
        </Pressable>
      )}

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ gap: GAP }} accessibilityLabel={`${MONTHS[month.month]}: ${monthNights} gece`}>
        <View style={styles.row}>
          {WEEKDAYS_SHORT.map((d) => (
            <Text key={d} style={[Type.caption, styles.weekday, { width: cell, color: theme.textSecondary }]}>
              {d}
            </Text>
          ))}
        </View>
        {cell > 0 &&
          rows.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((day, i) => {
                if (day === null) return <View key={i} style={{ width: cell, height: cell }} />;
                const key = keyOf(month.year, month.month, day);
                const night = byKey.get(key);
                const future = dayNumber(key) > dayNumber(today);
                if (!night) {
                  return (
                    <View key={i} style={[styles.day, { width: cell, height: cell }]}>
                      <Text style={[styles.dayText, { color: future ? theme.separator : theme.text, fontWeight: key === today ? '700' : '500' }]}>{day}</Text>
                    </View>
                  );
                }
                const uri = photoOf(night);
                const ring = key === selected ? theme.text : key === today ? theme.accent : undefined;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setSelected(key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${longDate(key)}, ${venueById(night.venueId)?.name ?? ''}`}
                    accessibilityState={{ selected: key === selected }}
                    style={[styles.day, { width: cell, height: cell }, ring && { borderWidth: 2.5, borderColor: ring }]}>
                    {uri ? <Image source={{ uri }} style={[StyleSheet.absoluteFill, styles.photo]} contentFit="cover" /> : null}
                    <Text style={[styles.dayText, styles.dayOnPhoto]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
      </View>

      {selectedNight && (
        <GlassCard style={styles.detail} onPress={() => onOpenNight(selectedNight)} accessibilityLabel={`${longDate(selectedNight.key)} gecesini aç`}>
          {photoOf(selectedNight) ? (
            <Image source={{ uri: photoOf(selectedNight) }} style={styles.detailPhoto} contentFit="cover" />
          ) : (
            <View style={[styles.detailPhoto, { backgroundColor: theme.fill }]} />
          )}
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={[Type.footnote, { color: theme.textSecondary }]}>
              {selectedNight.key === today ? 'Bu gece' : longDate(selectedNight.key)}
            </Text>
            <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
              {venueById(selectedNight.venueId)?.name}
            </Text>
            <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
              {detailOf(selectedNight)}
            </Text>
          </View>
          <Icon ios="chevron.right" md="chevron_right" size={13} color={theme.textSecondary} />
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthLabel: { fontWeight: '600', minWidth: 92, textAlign: 'center' },
  privacy: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 24, borderRadius: 12, marginTop: -4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: { textAlign: 'center', fontWeight: '600' },
  day: { borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { borderRadius: 8 },
  dayText: { fontSize: 14, fontVariant: ['tabular-nums'] },
  dayOnPhoto: { color: '#fff', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: Radius.card, padding: 12 },
  detailPhoto: { width: 48, height: 48, borderRadius: Radius.control },
});
