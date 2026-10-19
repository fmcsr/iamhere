import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { SectionTitle } from '@/components/profile-sections';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import type { Venue } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';
import { dayNumber, keyOf, longDate, monthLayout, tonightKey, type Night } from '@/lib/nights';

const GAP = 6;

/**
 * Anı takvimi (BeReal'in takvimi gibi): dışarıda olunan gecelerde o gecenin fotoğrafı küçük bir kare,
 * bu gece fuşya çerçeveli. Bir geceye dokununca o gece doğrudan açılır (paylaşımları ya da mekân).
 * Başlık ayın adı; yanındaki oklarla aylar arasında geçilir.
 */
export function NightCalendar({
  nights,
  venueById,
  photoOf,
  onOpenNight,
  privacy,
}: {
  nights: Night[];
  venueById: (id: string) => Venue | undefined;
  photoOf: (night: Night) => string | undefined;
  onOpenNight: (night: Night) => void;
  /** Kimlerin gördüğünü anlatan küçük etiket; dokununca ayarlara gider. */
  privacy?: { label: string; onPress?: () => void };
}) {
  const theme = useTheme();
  const t = useT();
  const today = tonightKey();
  const [ty, tm] = today.split('-').map(Number);
  const [month, setMonth] = useState({ year: ty, month: tm - 1 });
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
  const monthNights = nights.filter((n) => n.key.startsWith(keyOf(month.year, month.month, 1).slice(0, 7))).length;
  // Ay ve gün adları doğrudan `t`'den: React Compiler, monthName() gibi dili kendisi okuyan yardımcıların sonucunu
  // yalnızca argümanları değişince yeniden hesaplıyor (dil değişince eski dil kalırdı).
  const monthLabel = t.date.months[month.month];

  return (
    <View style={styles.wrap}>
      <SectionTitle
        title={`${monthLabel} ${month.year}`}
        right={
          <View style={styles.monthNav}>
            <Pressable
              onPress={() => shift(-1)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t.profile.calendar.previous}
              style={[styles.monthButton, { backgroundColor: theme.fill }]}>
              <Icon ios="chevron.left" md="chevron_left" size={14} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={() => !isCurrentMonth && shift(1)}
              hitSlop={6}
              disabled={isCurrentMonth}
              accessibilityRole="button"
              accessibilityLabel={t.profile.calendar.next}
              style={[styles.monthButton, { backgroundColor: theme.fill }]}>
              <Icon ios="chevron.right" md="chevron_right" size={14} color={isCurrentMonth ? theme.separator : theme.text} />
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

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ gap: GAP }} accessibilityLabel={t.profile.calendar.a11y(monthLabel, monthNights)}>
        <View style={styles.row}>
          {t.date.weekdaysShort.map((d) => (
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
                const ring = key === today ? theme.accent : undefined;
                return (
                  <Pressable
                    key={i}
                    onPress={() => onOpenNight(night)}
                    accessibilityRole="button"
                    accessibilityLabel={t.profile.calendar.night(longDate(key, t), venueById(night.venueId)?.name ?? '')}
                    style={({ pressed }) => [styles.day, { width: cell, height: cell, opacity: pressed ? 0.7 : 1 }, ring && { borderWidth: 2.5, borderColor: ring }]}>
                    {uri ? <Image source={{ uri }} style={[StyleSheet.absoluteFill, styles.photo]} contentFit="cover" /> : null}
                    <Text style={[styles.dayText, styles.dayOnPhoto]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  privacy: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 24, borderRadius: 12, marginTop: -4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: { textAlign: 'center', fontWeight: '600' },
  day: { borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { borderRadius: 8 },
  dayText: { fontSize: 14, fontVariant: ['tabular-nums'] },
  dayOnPhoto: { color: '#fff', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
});
