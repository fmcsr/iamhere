import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import type { Post, Venue } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';
import { dayNumber, type Night } from '@/lib/nights';

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

const styles = StyleSheet.create({
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
