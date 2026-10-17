import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { minutesAgo } from '@/components/kit';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { imageAspect, type Post } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

const GAP = 10;

/**
 * Paylaşımlar, Pinterest gibi iki sütunlu ızgarada: fotoğraflar kendi oranlarında, altında kısa yorum ve
 * mekân. Fotoğrafsız paylaşımlar alıntı kartı olur. Sütunlar, kartların tahmini yüksekliğine göre dengelenir.
 * Dokununca paylaşımlar ana sayfadaki gibi alt alta açılır (Instagram gibi).
 */
export function PostMasonry({ posts, onOpen }: { posts: Post[]; onOpen: (post: Post) => void }) {
  const columns: [Post[], Post[]] = [[], []];
  const heights = [0, 0];
  for (const post of posts) {
    // Sütun genişliği cinsinden tahmini yükseklik: fotoğraf + iki satırlık metin, ya da alıntı kartı.
    const height = post.imageUri ? 1 / imageAspect(post.imageUri) + 0.32 : 0.35 + Math.min(post.text?.length ?? 0, 160) / 220;
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
  const { venueById, liked } = useApp();
  const venue = venueById(post.venueId);
  const meta = `${venue?.name ?? ''} · ${minutesAgo(post.createdAt)}`;
  const likes = post.likes + (liked.has(post.id) ? 1 : 0);

  if (!post.imageUri) {
    return (
      <GlassCard style={styles.quote} onPress={onPress} accessibilityLabel={`${post.text}, ${meta}`}>
        <Icon ios="quote.opening" md="format_quote" size={18} color={theme.textSecondary} />
        <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]} numberOfLines={7}>
          {post.text}
        </Text>
        <Text style={[Type.caption, { color: theme.textSecondary }]} numberOfLines={1}>
          {meta}
        </Text>
      </GlassCard>
    );
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${venue?.name} paylaşımı. ${post.text ?? ''}`} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <View>
        <Image source={{ uri: post.imageUri }} style={[styles.photo, { aspectRatio: imageAspect(post.imageUri) }]} contentFit="cover" transition={200} />
        <View style={styles.likes}>
          <Icon ios="heart.fill" md="favorite" size={11} color="#fff" />
          <Text style={styles.likesText}>{likes}</Text>
        </View>
      </View>
      <View style={styles.caption}>
        {post.text && (
          <Text style={[Type.footnote, { color: theme.text }]} numberOfLines={2}>
            {post.text}
          </Text>
        )}
        <Text style={[Type.caption, { color: theme.textSecondary }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: GAP, alignItems: 'flex-start' },
  column: { flex: 1, gap: 14 },
  photo: { width: '100%', borderRadius: 16 },
  likes: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  likesText: { color: '#fff', fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  caption: { gap: 2, paddingHorizontal: 4, paddingTop: 7 },
  quote: { borderRadius: 16, padding: 14, gap: 8 },
});
