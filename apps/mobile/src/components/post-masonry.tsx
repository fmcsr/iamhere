import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { imageAspect, type Post } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

const GAP = 8;

/**
 * Pinterest gibi iki sütun: öğeler sırayla, o an daha kısa olan sütuna eklenir. `heightOf`, öğenin sütun
 * genişliği cinsinden tahmini yüksekliği.
 */
export function Masonry<T>({
  items,
  keyOf,
  heightOf,
  render,
  accessibilityLabel,
}: {
  items: T[];
  keyOf: (item: T) => string;
  heightOf: (item: T) => number;
  render: (item: T) => ReactNode;
  accessibilityLabel?: string;
}) {
  const columns: [T[], T[]] = [[], []];
  const heights = [0, 0];
  for (const item of items) {
    const column = heights[0] <= heights[1] ? 0 : 1;
    columns[column].push(item);
    heights[column] += heightOf(item);
  }

  return (
    <View style={styles.grid} accessibilityLabel={accessibilityLabel}>
      {columns.map((column, i) => (
        <View key={i} style={styles.column}>
          {column.map((item) => (
            <View key={keyOf(item)}>{render(item)}</View>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Paylaşımlar, Pinterest gibi: yalnızca fotoğraflar, kendi oranlarında; altında yazı yok. Fotoğrafsız
 * paylaşım, yazısının kendisi olan bir alıntı kartıdır. Dokununca paylaşımlar ana sayfadaki gibi alt alta
 * açılır (Instagram gibi).
 */
export function PostMasonry({ posts, onOpen }: { posts: Post[]; onOpen: (post: Post) => void }) {
  const t = useT();
  return (
    <Masonry
      items={posts}
      keyOf={(post) => post.id}
      heightOf={(post) => (post.imageUri ? 1 / imageAspect(post.imageUri) : 0.3 + Math.min(post.text?.length ?? 0, 160) / 200)}
      render={(post) => <Tile post={post} onPress={() => onOpen(post)} />}
      accessibilityLabel={t.profile.masonry.posts(posts.length)}
    />
  );
}

function Tile({ post, onPress }: { post: Post; onPress: () => void }) {
  const theme = useTheme();
  const t = useT();
  const { venueById } = useApp();
  const label = t.profile.masonry.post(venueById(post.venueId)?.name ?? '', post.text ?? '');

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
