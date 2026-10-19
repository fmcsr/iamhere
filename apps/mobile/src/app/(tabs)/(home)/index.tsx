import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GlassCard } from '@/components/glass';
import { HereMark } from '@/components/here-mark';
import { useHereRefresh } from '@/components/here-refresh';
import { Icon } from '@/components/icon';
import { Avatar, EventRow, PostCard, VenueCard } from '@/components/kit';
import { SegmentedPicker } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { StatusBarBlur } from '@/components/status-bar-blur';
import { Text } from '@/components/text';
import { Gap, Radius, Type } from '@/constants/theme';
import { type Category, type Post, type User } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

type Feed = 'ozel' | 'cevrende';

const INTEREST_CATEGORY: Record<string, Category> = {
  'Canlı müzik': 'konser',
  Kahve: 'kafe',
  Koşu: 'acik',
  Meyhane: 'yemek',
  Bar: 'bar',
};

/** "Gece Treni konseri · 21:00" → saat ve başlık; saati olmayan duyurular (ör. "02:00'ye kadar açık") etkinlik sayılmaz. */
function parseEvent(event?: string) {
  const parts = event?.split(' · ') ?? [];
  const time = parts.at(-1);
  return time && /^\d{2}:\d{2}$/.test(time) ? { title: parts.slice(0, -1).join(' · '), time } : undefined;
}

/**
 * Ana sayfa (TASARIM.md §5.2, T-20): "Bu gece nereye gitsem, kim nerede?" sorusunu cevaplar.
 * Sırayla: takipleştiklerin nerede → şu an canlı mekânlar → bu geceki etkinlikler → paylaşımlar.
 * Başlık çubuğu yok: balon HERE logosu akışla birlikte kayar; Dynamic Island çevresinde yalnızca bulanıklık.
 * Aşağı çekip yenileyince yükleniyor çarkı yerine bu logo soldan sağa döner (T-24).
 * Paylaşımlar kalıcı; 04:00'te yalnızca sohbetler sıfırlanır, bu yüzden burada sayaç yok (K-16).
 * Akış ScrollView ilk çocuk: yerel sekme çubuğu yalnızca böyle kaydırınca küçülür.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const t = useT();
  const { me, posts, users, venues, following, isMutual, venueById, checkIn, tonightPostOf } = useApp();
  const [feed, setFeed] = useState<Feed>('ozel');
  const { ref, refreshControl, angle } = useHereRefresh();

  const interestCategories = new Set(me.interests.map((i) => INTEREST_CATEGORY[i]).filter(Boolean));
  const visible = posts.filter((p) => p.audience !== 'takipciler' || p.userId === 'me' || following.has(p.userId));
  // İki akış da yeniden eskiye.
  const data = (
    feed === 'ozel'
      ? visible.filter(
          (p) =>
            p.userId === 'me' ||
            (!p.anonAlias && following.has(p.userId)) ||
            interestCategories.has(venueById(p.venueId)?.category as Category),
        )
      : [...visible]
  ).sort((a, b) => b.createdAt - a.createdAt);

  // "Şu an": yalnızca karşılıklı takipleştiklerinin bu geceki son (anonim olmayan) paylaşımı.
  const nowHere = users
    .filter((u) => isMutual(u.id))
    .flatMap((u) => {
      const post = tonightPostOf(u.id);
      return post ? [{ user: u, post }] : ([] as { user: User; post: Post }[]);
    });
  const friendsAt = (venueId: string) => nowHere.filter((n) => n.post.venueId === venueId).map((n) => n.user);
  // Canlı mekânlar: tanıdık olanlar önce, sonra kalabalık.
  const live = [...venues].sort((a, b) => friendsAt(b.id).length - friendsAt(a.id).length || b.here - a.here);
  const events = venues
    .flatMap((v) => {
      const e = parseEvent(v.event);
      return e ? [{ venue: v, ...e }] : [];
    })
    .sort((a, b) => a.time.localeCompare(b.time));
  const current = checkIn ? venueById(checkIn.venueId) : undefined;

  return (
    <View style={styles.screen} collapsable={false}>
      <Animated.ScrollView ref={ref} refreshControl={refreshControl} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <PageColumn style={styles.content}>
          <View style={styles.header}>
            <View accessible accessibilityRole="header" accessibilityLabel="HERE">
              <HereMark angle={angle} />
            </View>
          </View>

          {/* Başlıksız: halkalı avatarlar kendini anlatıyor (Instagram'daki hikâye şeridi gibi). */}
          <Section>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.strip}>
              <Pressable
                onPress={() => router.navigate('/checkin')}
                accessibilityRole="button"
                accessibilityLabel={current ? t.home.feed.meAt(current.name) : t.home.checkIn}
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
                <Text style={[Type.caption, { color: theme.text, fontWeight: '600' }]}>{current ? t.home.feed.me : t.home.checkIn}</Text>
                <Text style={[Type.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                  {current ? current.name : t.tabs.checkin}
                </Text>
              </Pressable>
              {nowHere.map(({ user, post }) => (
                <Pressable
                  key={user.id}
                  onPress={() => router.push({ pathname: '/venue/[id]', params: { id: post.venueId } })}
                  accessibilityRole="button"
                  accessibilityLabel={t.home.feed.friendAt(user.displayName, venueById(post.venueId)?.name ?? '')}
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
          </Section>

          <Section title={t.home.liveNow} action={t.home.feed.onMap} onAction={() => router.navigate('/explore')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.cards}>
              {live.map((v) => (
                <VenueCard key={v.id} venue={v} friends={friendsAt(v.id)} />
              ))}
            </ScrollView>
          </Section>

          {events.length > 0 && (
            <Section title={t.home.feed.tonight}>
              <GlassCard style={styles.list}>
                {events.map((e, i) => (
                  <View key={e.venue.id}>
                    {i > 0 && <View style={[styles.separator, { backgroundColor: theme.separator }]} />}
                    <EventRow venue={e.venue} time={e.time} title={e.title} />
                  </View>
                ))}
              </GlassCard>
            </Section>
          )}

          <Section title={t.titles.posts}>
            <SegmentedPicker<Feed>
              options={[
                { value: 'ozel', label: t.home.feed.forYou },
                { value: 'cevrende', label: t.home.feed.nearby },
              ]}
              value={feed}
              onChange={setFeed}
              accessibilityLabel={t.titles.posts}
            />
            <View style={styles.posts}>
              {data.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </View>
          </Section>
          <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>{t.home.feed.end}</Text>
        </PageColumn>
      </Animated.ScrollView>
      <StatusBarBlur />
    </View>
  );
}

/** Bölüm: isteğe bağlı iri başlık (Type.section) + sağda bağlantı. Bölümler arası boşluk her yerde aynı (Gap.section). */
function Section({ title, action, onAction, children }: { title?: string; action?: string; onAction?: () => void; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      {title && (
        <View style={styles.sectionHeader}>
          <Text style={[Type.section, { color: theme.text, flex: 1 }]} accessibilityRole="header">
            {title}
          </Text>
          {action && (
            <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link" style={styles.sectionAction}>
              <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]}>{action}</Text>
              <Icon ios="chevron.right" md="chevron_right" size={12} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 24 },
  content: { paddingHorizontal: Gap.page, paddingTop: 4, gap: Gap.section },
  header: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginBottom: -12 },
  section: { gap: Gap.block },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // Yatay şeritler ekran kenarına kadar uzanır (Uber Eats gibi); içerik yine sayfa boşluğundan başlar.
  bleed: { marginHorizontal: -Gap.page },
  strip: { gap: 14, paddingHorizontal: Gap.page },
  cards: { gap: 14, paddingHorizontal: Gap.page },
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
  list: { borderRadius: Radius.card, paddingHorizontal: 14 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 66 },
  posts: { gap: 16, marginTop: 4 },
  footer: { textAlign: 'center', paddingVertical: 8 },
});
