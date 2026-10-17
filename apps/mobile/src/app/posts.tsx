import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { PostCard } from '@/components/kit';
import { PageColumn } from '@/components/page-column';
import { Gap, TitleFonts } from '@/constants/theme';
import { useApp } from '@/data/store';

/**
 * Bir kişinin paylaşımları ya da etiketlendiği paylaşımlar (`kind=tagged`) alt alta (Instagram'da ızgaradan
 * bir gönderiye girince olduğu gibi), ana sayfadaki kartlarla. Dokunulan paylaşımdan başlar; yukarı
 * kaydırınca daha yenileri görünür.
 */
export default function PostsScreen() {
  const { user: userId = 'me', start, kind } = useLocalSearchParams<{ user?: string; start?: string; kind?: 'tagged' }>();
  const { posts, userById, canSee, taggedPostsOf } = useApp();
  const scroll = useRef<ScrollViewInstance>(null);
  const scrolled = useRef(false);

  const owner = userById(userId);
  const mine = userId === 'me';
  // Anonim paylaşımlar profile bağlanmaz; takipçilere özel olanları yalnızca takipçiler görür.
  const list =
    kind === 'tagged'
      ? taggedPostsOf(userId)
      : posts.filter((p) => p.userId === userId && !p.anonAlias && canSee(p)).sort((a, b) => b.createdAt - a.createdAt);
  const title = kind === 'tagged' ? (mine ? 'Etiketlendiklerin' : 'Etiketlenenler') : mine ? 'Paylaşımların' : `@${owner.username}`;

  return (
    <ScrollView ref={scroll} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      <Stack.Title {...TitleFonts}>{title}</Stack.Title>
      <PageColumn style={styles.content}>
        {list.map((post, index) => (
          <View
            key={post.id}
            onLayout={
              post.id === start && index > 0
                ? (e) => {
                    if (scrolled.current) return;
                    scrolled.current = true;
                    // Kaydırma görünümü başlık boşluğunu kendisi ekliyor: kartın üstü, başlığın hemen altına gelir.
                    scroll.current?.scrollTo({ y: e.nativeEvent.layout.y - 12, animated: false });
                  }
                : undefined
            }>
            <PostCard post={post} />
          </View>
        ))}
      </PageColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  content: { paddingHorizontal: Gap.page, paddingTop: 8, gap: 16 },
});
