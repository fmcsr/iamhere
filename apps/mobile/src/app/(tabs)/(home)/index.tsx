import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Avatar, LiveCount, PostCard, VenueIcon } from '@/components/kit';
import { SegmentedPicker } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { StatusBarBlur } from '@/components/status-bar-blur';
import { Text } from '@/components/text';
import { Wordmark } from '@/components/wordmark';
import { Type } from '@/constants/theme';
import { type Category, type Post } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

type Feed = 'ozel' | 'cevrende';

const INTEREST_CATEGORY: Record<string, Category> = {
  'Canlı müzik': 'konser',
  Kahve: 'kafe',
  Koşu: 'acik',
  Meyhane: 'yemek',
  Bar: 'bar',
};

/**
 * Ana sayfa (TASARIM.md §5.2). Başlık çubuğu yok: HERE satırı akışla birlikte yukarı kayıp
 * kaybolur; Dynamic Island çevresinde yalnızca kademeli bulanıklık kalır (Instagram gibi).
 * Paylaşımlar kalıcı; 04:00'te yalnızca sohbetler sıfırlanır, bu yüzden burada sayaç yok (K-16).
 * Akış ScrollView ilk çocuk: yerel sekme çubuğu yalnızca böyle kaydırınca küçülür.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const { me, posts, users, venues, following, isMutual, venueById, checkIn } = useApp();
  const [feed, setFeed] = useState<Feed>('ozel');

  const interestCategories = new Set(me.interests.map((i) => INTEREST_CATEGORY[i]).filter(Boolean));
  const visible = posts.filter((p) => p.audience !== 'takipciler' || p.userId === 'me' || following.has(p.userId));
  const data =
    feed === 'ozel'
      ? visible.filter(
          (p) =>
            p.userId === 'me' ||
            (!p.anonAlias && following.has(p.userId)) ||
            interestCategories.has(venueById(p.venueId)?.category as Category),
        )
      : [...visible].sort((a, b) => b.createdAt - a.createdAt);

  // "Şu an": yalnızca karşılıklı takipleştiklerinin en son (anonim olmayan) yer bildirimi.
  const nowHere = users
    .filter((u) => isMutual(u.id))
    .flatMap((u) => {
      const post = posts.find((p) => p.userId === u.id && !p.anonAlias);
      return post ? [{ user: u, post }] : ([] as { user: typeof u; post: Post }[]);
    });
  const live = [...venues].sort((a, b) => b.here - a.here);
  const current = checkIn ? venueById(checkIn.venueId) : undefined;

  return (
    <View style={styles.screen} collapsable={false}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <PageColumn style={styles.content}>
          <View style={styles.header}>
            <View accessible accessibilityRole="header" accessibilityLabel="HERE">
              <Wordmark height={24} color={theme.text} />
            </View>
          </View>

          <SegmentedPicker<Feed>
            options={[
              { value: 'ozel', label: 'Sana özel' },
              { value: 'cevrende', label: 'Çevrende' },
            ]}
            value={feed}
            onChange={setFeed}
            accessibilityLabel="Akış"
          />

          {feed === 'ozel' ? (
            <View style={styles.section}>
              <Text style={[Type.headline, { color: theme.text }]}>Takipleştiklerin şu an</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
                <Pressable
                  onPress={() => router.navigate('/checkin')}
                  accessibilityRole="button"
                  accessibilityLabel={current ? `Sen, ${current.name}` : 'Yer bildir'}
                  style={styles.person}>
                  {/* Kendi fotoğrafın: yer bildirdiysen fuşya halka, bildirmediysen "+" rozeti (Instagram'daki "Hikâyen" gibi). */}
                  <View style={styles.me}>
                    <Avatar name={me.displayName} color={me.avatarColor} uri={me.avatarUri} size={60} ring={Boolean(current)} />
                    {!current && (
                      <View style={[styles.addBadge, { backgroundColor: theme.accent, borderColor: theme.background }]}>
                        <Icon ios="plus" md="add" size={13} color={theme.onAccent} />
                      </View>
                    )}
                  </View>
                  <Text style={[Type.caption, { color: theme.text, fontWeight: '600' }]}>{current ? 'Sen' : 'Yer bildir'}</Text>
                  <Text style={[Type.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                    {current ? current.name : 'Buradayım'}
                  </Text>
                </Pressable>
                {nowHere.map(({ user, post }) => (
                  <Pressable
                    key={user.id}
                    onPress={() => router.push({ pathname: '/venue/[id]', params: { id: post.venueId } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${user.displayName}, şu an ${venueById(post.venueId)?.name}`}
                    style={styles.person}>
                    <Avatar name={user.displayName} color={user.avatarColor} uri={user.avatarUri} size={60} ring />
                    <Text style={[Type.caption, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                      {user.displayName.split(' ')[0]}
                    </Text>
                    <Text style={[Type.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                      {venueById(post.venueId)?.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={[Type.headline, { color: theme.text }]}>Şu an canlı</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
                {live.map((v) => (
                  <Pressable
                    key={v.id}
                    onPress={() => router.push({ pathname: '/venue/[id]', params: { id: v.id } })}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                    <GlassCard style={styles.liveCard}>
                      <VenueIcon category={v.category} size={36} />
                      <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                        {v.name}
                      </Text>
                      <LiveCount count={v.here} suffix="burada" />
                    </GlassCard>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {data.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>Şimdilik bu kadar.</Text>
        </PageColumn>
      </ScrollView>
      <StatusBarBlur />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 24 },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 2, minHeight: 48 },
  section: { gap: 10 },
  strip: { gap: 14, paddingRight: 8 },
  person: { width: 72, alignItems: 'center', gap: 4 },
  me: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  addBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveCard: { width: 156, borderRadius: 20, padding: 12, gap: 8 },
  footer: { textAlign: 'center', paddingVertical: 8 },
});
