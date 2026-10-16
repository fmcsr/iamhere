import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { LiveCount, VenueIcon, formatDistance } from '@/components/kit';
import { Text } from '@/components/text';
import { VenueMap } from '@/components/venue-map';
import { Type } from '@/constants/theme';
import { CATEGORY_LABEL, type Category } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

type Filter = 'all' | Category;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Şu an canlı' },
  { value: 'bar', label: 'Bar' },
  { value: 'konser', label: 'Konser' },
  { value: 'yemek', label: 'Yemek' },
  { value: 'kafe', label: 'Kafe' },
  { value: 'acik', label: 'Açık hava' },
];

const CARD_WIDTH = 264;
const CARD_GAP = 10;

/**
 * Keşfet (TASARIM.md §5.5): tam ekran harita, üstünde cam kontroller, altta cam mekân kartları.
 * Kişilerin konumu asla gösterilmez; yalnızca mekânlar ve oradaki kişi sayısı.
 */
export default function ExploreScreen() {
  const theme = useTheme();
  const { venues } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string>();
  const carousel = useRef<ScrollViewInstance>(null);

  const shown = venues.filter((v) => filter === 'all' || v.category === filter).sort((a, b) => b.here - a.here);

  const select = (id: string) => {
    setSelected(id);
    const index = shown.findIndex((v) => v.id === id);
    if (index >= 0) carousel.current?.scrollTo({ x: index * (CARD_WIDTH + CARD_GAP), animated: true });
  };

  return (
    <View style={{ flex: 1 }}>
      <VenueMap venues={shown} selectedId={selected} onSelect={select} style={StyleSheet.absoluteFill} />

      <SafeAreaView edges={{ top: true, bottom: true, left: true, right: true }} style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.top} pointerEvents="box-none">
          <View style={styles.topRow} pointerEvents="box-none">
            <Glass style={styles.place}>
              <Icon ios="location.fill" md="near_me" size={14} color={theme.text} />
              <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]}>Kadıköy</Text>
              <Text style={[Type.subheadline, { color: theme.textSecondary }]}>· {shown.length} canlı mekân</Text>
            </Glass>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {FILTERS.map((f) => {
              const active = f.value === filter;
              return (
                <Pressable
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}>
                  <Glass style={styles.chip} tint={active ? theme.accent : undefined} interactive>
                    <Text style={[Type.subheadline, { color: active ? theme.onAccent : theme.text, fontWeight: '600' }]}>{f.label}</Text>
                  </Glass>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          ref={carousel}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.carousel}
          style={styles.carouselView}>
          {shown.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => router.push({ pathname: '/venue/[id]', params: { id: v.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${v.name}, ${CATEGORY_LABEL[v.category]}, ${formatDistance(v.distanceM)}, ${v.here} kişi burada`}>
              <Glass
                style={[styles.card, { width: CARD_WIDTH }]}
                tint={v.id === selected ? 'rgba(225, 29, 73, 0.22)' : undefined}
                interactive>
                <VenueIcon category={v.category} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
                    {v.name}
                  </Text>
                  <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
                    {CATEGORY_LABEL[v.category]} · {formatDistance(v.distanceM)}
                  </Text>
                  <LiveCount count={v.here} suffix="burada" />
                </View>
              </Glass>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flex: 1, gap: 10, paddingTop: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 16 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, flexShrink: 1 },
  chips: { gap: 8, paddingHorizontal: 16 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center' },
  carouselView: { flexGrow: 0 },
  carousel: { gap: CARD_GAP, paddingHorizontal: 16, paddingBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 24 },
});
