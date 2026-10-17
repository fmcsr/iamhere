import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { LiveCount, VenueIcon, VenueRow, formatDistance } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { Text } from '@/components/text';
import { VenueMap } from '@/components/venue-map';
import { TitleFonts, Type } from '@/constants/theme';
import { CHECK_IN_RADIUS_M } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

/**
 * Buradayım (TASARIM.md §5.3): yalnızca yakındaki mekânlar listelenir (K-02). 300 m dışındakiler
 * gizlenmez, soluk görünür. Mekâna dokununca yer bildirme sayfası açılır.
 */
export default function CheckInScreen() {
  const theme = useTheme();
  const { venues, checkIn, venueById } = useApp();
  const [query, setQuery] = useState('');

  const nearby = [...venues]
    .sort((a, b) => a.distanceM - b.distanceM)
    .filter((v) => v.name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));
  const current = checkIn ? venueById(checkIn.venueId) : undefined;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scroll}>
      <Stack.Title large {...TitleFonts}>Buradayım</Stack.Title>
      <Stack.SearchBar placeholder="Mekân ara" hideWhenScrolling={false} onChangeText={(e) => setQuery(e.nativeEvent.text)} />
      <PageColumn style={styles.content}>

        {current && (
          <GlassCard style={styles.card}>
            <View style={styles.currentRow}>
              <VenueIcon category={current.category} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[Type.footnote, { color: theme.textSecondary }]}>Şu an buradasın</Text>
                <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
                  {current.name}
                </Text>
                <LiveCount count={current.here} suffix="kişi burada" />
              </View>
            </View>
            <ActionButton
              title="Mekân sohbetine git"
              systemImage="bubble.left.and.bubble.right.fill"
              fullWidth
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: `c-${current.id}` } })}
            />
          </GlassCard>
        )}

        <View style={styles.map}>
          <VenueMap
            venues={nearby}
            radius={CHECK_IN_RADIUS_M}
            showMe
            zoom={0.012}
            recenter
            // Harita gezilebilir; ama yer bildirimi yine yalnızca 300 m içinde (K-17): uzak pin mekân sayfasını açar.
            onSelect={(id) => {
              const far = (venueById(id)?.distanceM ?? Infinity) > CHECK_IN_RADIUS_M;
              router.push(far ? { pathname: '/venue/[id]', params: { id } } : { pathname: '/compose', params: { venueId: id } });
            }}
          />
        </View>
        <View style={styles.note}>
          <Icon ios="lock.shield" md="shield" size={16} color={theme.textSecondary} />
          <Text style={[Type.footnote, { color: theme.textSecondary, flex: 1 }]}>
            Tam konumun kimseyle paylaşılmaz. Diğerleri yalnızca seçtiğin mekânı görür.
          </Text>
        </View>

        <Text style={[Type.section, { color: theme.text }]}>Yakındaki mekânlar</Text>
        <GlassCard style={styles.list}>
          {nearby.map((v, i) => {
            const tooFar = v.distanceM > CHECK_IN_RADIUS_M;
            return (
              <View key={v.id}>
                {i > 0 && <View style={[styles.separator, { backgroundColor: theme.separator }]} />}
                <VenueRow
                  venue={v}
                  dimmed={tooFar}
                  subtitle={tooFar ? `${formatDistance(v.distanceM)} · Mekânda olmalısın` : undefined}
                  trailing={tooFar ? <Icon ios="lock.fill" md="lock" size={15} color={theme.textSecondary} /> : undefined}
                  onPress={() =>
                    tooFar
                      ? router.push({ pathname: '/venue/[id]', params: { id: v.id } })
                      : router.push({ pathname: '/compose', params: { venueId: v.id } })
                  }
                />
              </View>
            );
          })}
          {nearby.length === 0 && (
            <Text style={[Type.subheadline, { color: theme.textSecondary, paddingVertical: 16 }]}>“{query}” için yakında mekân yok.</Text>
          )}
        </GlassCard>
        <Text style={[Type.footnote, { color: theme.textSecondary }]}>
          Yer bildirmek için mekâna {CHECK_IN_RADIUS_M} m’den yakın olmalısın; böylece sohbetlerde gerçekten orada olanlar
          buluşur. Prototipte konum sahte, mekânlar Kadıköy’de.
        </Text>
      </PageColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  content: { padding: 16, paddingTop: 8, gap: 14 },
  card: { borderRadius: 22, padding: 14, gap: 14 },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  map: { height: 220, borderRadius: 22, overflow: 'hidden' },
  note: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  list: { borderRadius: 22, paddingHorizontal: 14, paddingVertical: 4 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
});
