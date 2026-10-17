import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { LiveCount } from '@/components/kit';
import { Pill } from '@/components/pill';
import { Text } from '@/components/text';
import { Gap, Radius, Type } from '@/constants/theme';
import type { Post, Venue } from '@/data/mock';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { dayNumber, shortDate, type Night, type NightSummary } from '@/lib/nights';

/** Bir gecenin fotoğrafı: o gece paylaşılan ilk fotoğraf, yoksa mekânın o geceye düşen fotoğrafı. */
export function nightPhoto(night: Night, postById: (id: string) => Post | undefined, venue?: Venue): string | undefined {
  for (const id of night.postIds) {
    const uri = postById(id)?.imageUri;
    if (uri) return uri;
  }
  if (!venue) return undefined;
  const photos = venue.nightPhotos.length ? venue.nightPhotos : [venue.coverUri];
  return photos[dayNumber(night.key) % photos.length];
}

const openVenue = (venueId: string) => router.push({ pathname: '/venue/[id]', params: { id: venueId } });

/** Bölüm başlığı: iri başlık (T-20) ve isteğe bağlı sağ öğe. */
export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <Text style={[Type.section, { color: theme.text, flex: 1 }]} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}

/**
 * "Şu an" kartı (Posh'taki "sıradaki etkinlik" gibi): kişi bir mekândaysa mekân, kalabalık ve tek eylem.
 * Mekân yoksa aynı yerde davet (ör. "Bu gece neredesin? · Buradayım").
 */
export function NowCard({
  venue,
  caption,
  title,
  action,
}: {
  venue?: Venue;
  caption: string;
  title: string;
  action: { title: string; onPress: () => void };
}) {
  const theme = useTheme();
  return (
    <GlassCard style={styles.now} onPress={venue ? () => openVenue(venue.id) : action.onPress} accessibilityLabel={`${caption}: ${title}`}>
      {venue ? (
        <Image source={{ uri: venue.coverUri }} style={styles.nowThumb} contentFit="cover" />
      ) : (
        <View style={[styles.nowThumb, styles.nowIcon, { backgroundColor: theme.fill }]}>
          <Icon ios="moon.stars" md="bedtime" size={24} color={theme.text} />
        </View>
      )}
      <View style={styles.grow}>
        <Text style={[Type.footnote, { color: theme.textSecondary }]}>{caption}</Text>
        <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {venue && <LiveCount count={venue.here} suffix="kişi burada" />}
      </View>
      <Pill title={action.title} onPress={action.onPress} />
    </GlassCard>
  );
}

/** "Son 30 gün" kartı (Beli gibi): kaç gece, kaç mekân, kaç semt; en çok gidilen mekân ve seri. */
export function NightSummaryCard({ summary, subject = 'sen' }: { summary: NightSummary; subject?: 'sen' | 'o' }) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  return (
    <GlassCard style={styles.summary}>
      <LinearGradient
        pointerEvents="none"
        colors={dark ? ['rgba(225,29,73,0.16)', 'rgba(95,105,190,0.14)'] : ['rgba(225,29,73,0.10)', 'rgba(110,130,220,0.12)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[Type.headline, { color: theme.text }]}>Son 30 gün</Text>
      {summary.nights === 0 ? (
        <Text style={[Type.subheadline, { color: theme.textSecondary }]}>
          {subject === 'sen' ? 'Son 30 günde yer bildirmedin.' : 'Son 30 günde yer bildirmemiş.'}
        </Text>
      ) : (
        <>
          <View style={styles.big3}>
            <Big value={summary.nights} label="gece" />
            <Big value={summary.venues} label="mekân" divider />
            <Big value={summary.areas} label="semt" divider />
          </View>
          {summary.top && (
            <Pressable onPress={() => openVenue(summary.top!.venue.id)} style={[styles.summaryRow, { borderTopColor: theme.separator }]}>
              <Image source={{ uri: summary.top.venue.coverUri }} style={styles.rowThumb} contentFit="cover" />
              <View style={styles.grow}>
                <Text style={[Type.footnote, { color: theme.textSecondary }]}>{subject === 'sen' ? 'En çok gittiğin' : 'En çok gittiği'}</Text>
                <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                  {summary.top.venue.name}
                </Text>
              </View>
              <Text style={[Type.subheadline, { color: theme.text, fontWeight: '700' }]}>{summary.top.count} kez</Text>
            </Pressable>
          )}
          {summary.streakWeeks >= 2 && (
            <View style={[styles.summaryRow, { borderTopColor: theme.separator }]}>
              <View style={[styles.rowThumb, styles.flame, { backgroundColor: theme.fill }]}>
                <Text style={{ fontSize: 20 }}>🔥</Text>
              </View>
              <View style={styles.grow}>
                <Text style={[Type.footnote, { color: theme.textSecondary }]}>Seri</Text>
                <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]}>
                  {summary.streakWeeks} haftadır her hafta dışarıda{subject === 'sen' ? 'sın' : ''}
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </GlassCard>
  );
}

function Big({ value, label, divider }: { value: number; label: string; divider?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.bigItem, divider && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: theme.separator, paddingLeft: 14 }]}>
      <Text style={[styles.bigValue, { color: theme.text }]}>{value}</Text>
      <Text style={[Type.footnote, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

/** Sık gidilen mekânlar (corner ve Swarm listeleri gibi), liste tutmadan: kaç kez gidildiğiyle. */
export function FrequentVenues({ items, title = 'Sık gittiklerin' }: { items: { venue: Venue; count: number }[]; title?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <SectionTitle title={title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.strip}>
        {items.map(({ venue, count }) => (
          <Pressable
            key={venue.id}
            onPress={() => openVenue(venue.id)}
            accessibilityRole="button"
            accessibilityLabel={`${venue.name}, ${count} kez`}
            style={({ pressed }) => [styles.freq, { opacity: pressed ? 0.75 : 1 }]}>
            <View>
              <Image source={{ uri: venue.coverUri }} style={styles.freqPhoto} contentFit="cover" transition={150} />
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{count} kez</Text>
              </View>
            </View>
            <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
              {venue.name}
            </Text>
            <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
              {venue.area}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/** Başkasının profilinde (Partiful ve Beli gibi): birlikte olduğunuz geceler ve ikinizin de gittiği mekânlar. */
export function SharedNights({
  nights,
  bothVenues,
  photoOf,
  venueById,
}: {
  nights: Night[];
  bothVenues: Venue[];
  photoOf: (night: Night) => string | undefined;
  venueById: (id: string) => Venue | undefined;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      {nights.length > 0 && (
        <>
          <SectionTitle title={`Birlikte olduğunuz geceler · ${nights.length}`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.strip}>
            {nights.map((night) => {
              const venue = venueById(night.venueId);
              const uri = photoOf(night);
              return (
                <Pressable key={night.key} onPress={() => openVenue(night.venueId)} accessibilityRole="button" style={styles.shared}>
                  {uri ? <Image source={{ uri }} style={styles.sharedPhoto} contentFit="cover" /> : <View style={[styles.sharedPhoto, { backgroundColor: theme.fill }]} />}
                  <Text style={[Type.caption, { color: theme.textSecondary }]}>{shortDate(night.key)}</Text>
                  <Text style={[Type.footnote, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                    {venue?.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}
      {bothVenues.length > 0 && (
        <View style={{ gap: 10, marginTop: nights.length ? 8 : 0 }}>
          <Text style={[Type.headline, { color: theme.text }]}>İkinizin de gittiği mekânlar</Text>
          <View style={styles.pills}>
            {bothVenues.map((v) => (
              <Pill key={v.id} title={v.name} onPress={() => openVenue(v.id)} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

/** Karşılıklı takipleşmeyenler takvim ve istatistik yerine bunu görür (gizlilik, TASARIM.md §5.8). */
export function LockedNights({ onFollow, following }: { onFollow: () => void; following: boolean }) {
  const theme = useTheme();
  return (
    <GlassCard style={styles.locked}>
      <View style={[styles.lockIcon, { backgroundColor: theme.fill }]}>
        <Icon ios="lock.fill" md="lock" size={22} color={theme.text} />
      </View>
      <Text style={[Type.headline, { color: theme.text }]}>Geceleri gizli</Text>
      <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>
        Takvimini ve istatistiklerini yalnızca karşılıklı takipleştikleri görür. Paylaşımları aşağıda.
      </Text>
      {!following && <Pill title="Takip et" tone="ink" onPress={onFollow} />}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  section: { gap: Gap.block },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1, gap: 2, minWidth: 0 },
  now: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: Radius.card, padding: 14 },
  nowThumb: { width: 56, height: 56, borderRadius: Radius.photo },
  nowIcon: { alignItems: 'center', justifyContent: 'center' },
  summary: { borderRadius: Radius.card, padding: 16, gap: 4, overflow: 'hidden' },
  big3: { flexDirection: 'row', marginTop: 10, marginBottom: 4 },
  bigItem: { flex: 1, gap: 0 },
  bigValue: { fontSize: 30, fontWeight: '700', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  rowThumb: { width: 44, height: 44, borderRadius: Radius.control },
  flame: { alignItems: 'center', justifyContent: 'center' },
  bleed: { marginHorizontal: -Gap.page },
  strip: { gap: 12, paddingHorizontal: Gap.page },
  freq: { width: 156, gap: 2 },
  freqPhoto: { width: 156, height: 112, borderRadius: Radius.photo, marginBottom: 6 },
  countBadge: { position: 'absolute', left: 8, top: 8, paddingHorizontal: 8, height: 24, borderRadius: 12, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  countBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  shared: { width: 96, gap: 1 },
  sharedPhoto: { width: 96, height: 96, borderRadius: Radius.control, marginBottom: 5 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locked: { alignItems: 'center', gap: 8, borderRadius: Radius.card, padding: 22 },
  lockIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
