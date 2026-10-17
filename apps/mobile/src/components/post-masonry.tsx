import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { imageAspect, type Post } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

const GAP = 8;

/**
 * Paylaşımlar, Pinterest gibi iki sütunlu ızgarada: yalnızca fotoğraflar, kendi oranlarında; altında yazı
 * yok. Fotoğrafsız paylaşım, yazısının kendisi olan bir alıntı kartıdır. Sütunlar, kartların tahmini
 * yüksekliğine göre dengelenir. Dokununca paylaşımlar ana sayfadaki gibi alt alta açılır (Instagram gibi).
 */
export function PostMasonry({ posts, onOpen }: { posts: Post[]; onOpen: (post: Post) => void }) {
  const columns: [Post[], Post[]] = [[], []];
  const heights = [0, 0];
  for (const post of posts) {
    // Sütun genişliği cinsinden tahmini yükseklik.
    const height = post.imageUri ? 1 / imageAspect(post.imageUri) : 0.3 + Math.min(post.text?.length ?? 0, 160) / 200;
    const column = heights[0] <= heights[1] ? 0 : 1;
    columns[column].push(post);
    heights[column] += height;
  }

  return (
    <View style={styles.grid} accessibilityLabel={`${posts.length} paylaşım`}>
      {columns.map((column, i) => (
        <View key={i} style={styles.column}>
          {column.map((post) => (
            <Tile key={post.id} post={post} onPress={() => onOpen(post)} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Tile({ post, onPress }: { post: Post; onPress: () => void }) {
  const theme = useTheme();
  const { venueById } = useApp();
  const label = `${venueById(post.venueId)?.name ?? ''} paylaşımı. ${post.text ?? ''}`;

  if (!post.imageUri) {
    return (
      <GlassCard style={styles.quote} onPress={onPress} accessibilityLabel={label}>
        <Icon ios="quote.opening" md="format_quote" size={18} color={theme.textSecondary} />
        <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]} numberOfLines={8}>
          {post.text}
        </Text>
      </GlassCard>
    );
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Image source={{ uri: post.imageUri }} style={[styles.photo, { aspectRatio: imageAspect(post.imageUri) }]} contentFit="cover" transition={200} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: GAP, alignItems: 'flex-start' },
  column: { flex: 1, gap: GAP },
  photo: { width: '100%', borderRadius: 16 },
  quote: { borderRadius: 16, padding: 14, gap: 8 },
});
