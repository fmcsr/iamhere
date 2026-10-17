import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Pill } from '@/components/pill';
import { Text } from '@/components/text';
import { Gap, Radius, Type } from '@/constants/theme';
import type { Post, Venue } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';
import { dayNumber, shortDate, type Night } from '@/lib/nights';

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

/** Başkasının gecelerinde (Partiful ve Beli gibi): birlikte olduğunuz geceler ve ikinizin de gittiği mekânlar. */
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

const styles = StyleSheet.create({
  section: { gap: Gap.block },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bleed: { marginHorizontal: -Gap.page },
  strip: { gap: 12, paddingHorizontal: Gap.page },
  shared: { width: 96, gap: 1 },
  sharedPhoto: { width: 96, height: 96, borderRadius: Radius.control, marginBottom: 5 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
