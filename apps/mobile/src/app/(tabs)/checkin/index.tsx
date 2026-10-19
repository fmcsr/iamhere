import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { LiveCount, VenueIcon, VenueRow, formatDistance } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { SearchField } from '@/components/search-field';
import { StatusBarBlur } from '@/components/status-bar-blur';
import { Text } from '@/components/text';
import { VenueMap } from '@/components/venue-map';
import { Type } from '@/constants/theme';
import { CHECK_IN_RADIUS_M } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

/** Listede 1 km içindeki mekânlar (K-02); aranınca hepsi. */
const LIST_RADIUS_M = 1000;

/**
 * Buradayım (TASARIM.md §5.3): listede yalnızca yakındaki mekânlar (1 km içi, K-02); 300 m dışındakiler
 * soluk ve kilitli. Harita gezilebilir, aramada tüm mekânlar çıkar. Yakındaki mekâna dokununca yer bildirme
 * sayfası, uzağa dokununca mekân sayfası, zaten yer bildirdiğin mekâna dokununca sohbeti açılır.
 */
export default function CheckInScreen() {
  const theme = useTheme();
  const t = useT();
  const { venues, checkIn, venueById } = useApp();
  const [query, setQuery] = useState('');

  const matches = [...venues]
    .sort((a, b) => a.distanceM - b.distanceM)
    .filter((v) => v.name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));
  const nearby = query.trim() ? matches : matches.filter((v) => v.distanceM <= LIST_RADIUS_M);
  const current = checkIn ? venueById(checkIn.venueId) : undefined;

  // Zaten yer bildirdiğin mekân yeniden bildirilmez (aynı fotoğraf iki kez paylaşılmasın): sohbeti açılır.
  const openVenue = (id: string) => {
    if (id === checkIn?.venueId) return router.push({ pathname: '/chat/[id]', params: { id: `c-${id}` } });
    const far = (venueById(id)?.distanceM ?? Infinity) > CHECK_IN_RADIUS_M;
    router.push(far ? { pathname: '/venue/[id]', params: { id } } : { pathname: '/check-in/[venueId]', params: { venueId: id } });
  };

  return (
    <View style={{ flex: 1 }} collapsable={false}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <PageColumn style={styles.content}>
          {/* Başlık yok: sekme zaten "Buradayım". Arama alanı içerikle kayar; üstte yalnızca ada bulanıklığı. */}
          <SearchField value={query} onChangeText={setQuery} placeholder={t.home.checkin.search} />

          {current && (
            <GlassCard style={styles.card}>
              <View style={styles.currentRow}>
                <VenueIcon category={current.category} size={48} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[Type.footnote, { color: theme.textSecondary }]}>{t.home.checkin.current}</Text>
                  <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
                    {current.name}
                  </Text>
                  <LiveCount count={current.here} text={t.live.here(current.here)} />
                </View>
              </View>
              <ActionButton
                title={t.home.checkin.goToChat}
                systemImage="bubble.left.and.bubble.right.fill"
                fullWidth
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: `c-${current.id}` } })}
              />
            </GlassCard>
          )}

          <View style={styles.map}>
            <VenueMap
              venues={matches}
              radius={CHECK_IN_RADIUS_M}
              showMe
              zoom={0.012}
              recenter
              // Harita gezilebilir; ama yer bildirimi yine yalnızca 300 m içinde (K-17): uzak pin mekân sayfasını açar,
              // yakındaki pin alttan yer bildirme sayfasını (iğneyi aşağı kaydır, T-26).
              onSelect={openVenue}
            />
          </View>
          <View style={styles.note}>
            <Icon ios="lock.shield" md="shield" size={16} color={theme.textSecondary} />
            <Text style={[Type.footnote, { color: theme.textSecondary, flex: 1 }]}>{t.home.checkin.privacy}</Text>
          </View>

          <Text style={[Type.section, { color: theme.text }]}>{t.home.checkin.nearby}</Text>
          <GlassCard style={styles.list}>
            {nearby.map((v, i) => {
              const tooFar = v.distanceM > CHECK_IN_RADIUS_M;
              return (
                <View key={v.id}>
                  {i > 0 && <View style={[styles.separator, { backgroundColor: theme.separator }]} />}
                  <VenueRow
                    venue={v}
                    dimmed={tooFar}
                    subtitle={tooFar ? `${formatDistance(v.distanceM, t)} · ${t.home.checkin.mustBeThere}` : undefined}
                    trailing={tooFar ? <Icon ios="lock.fill" md="lock" size={15} color={theme.textSecondary} /> : undefined}
                    onPress={() => openVenue(v.id)}
                  />
                </View>
              );
            })}
            {nearby.length === 0 && (
              <Text style={[Type.subheadline, { color: theme.textSecondary, paddingVertical: 16 }]}>{t.home.checkin.empty(query)}</Text>
            )}
          </GlassCard>
          <Text style={[Type.footnote, { color: theme.textSecondary }]}>{t.home.checkin.note(CHECK_IN_RADIUS_M)}</Text>
        </PageColumn>
      </ScrollView>
      <StatusBarBlur />
    </View>
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
