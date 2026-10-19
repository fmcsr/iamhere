import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AvatarStack, formatDistance } from '@/components/kit';
import { SegmentedPicker } from '@/components/native-controls';
import { Masonry, PostMasonry } from '@/components/post-masonry';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { imageAspect, type Post, type User, type Venue } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';
import { alsoName, genitive, joinNames } from '@/lib/tr';

type Tab = 'posts' | 'tagged' | 'saved';

/**
 * Profilin alt bölümü (TASARIM.md §5.8, T-25): üç sekme. Paylaşımlar ve etiketlendiği paylaşımlar Pinterest
 * gibi ızgarada (dokununca dikey akış); To-HERE, kişinin gitmek istediği mekânlar (mekân sayfasında kaydedilir).
 * `posts`: profilde görünen kendi paylaşımları (gizlilik süzgeci ekrandan gelir).
 */
export function ProfileTabs({ userId, posts }: { userId: string; posts: Post[] }) {
  const t = useT();
  const { taggedPostsOf, savedOf, venueById, userById } = useApp();
  const [tab, setTab] = useState<Tab>('posts');
  const mine = userId === 'me';
  const name = userById(userId).displayName.split(' ')[0];
  const tagged = taggedPostsOf(userId);
  const saved = savedOf(userId)
    .map((id) => venueById(id))
    .filter((v): v is Venue => Boolean(v));

  const open = (post: Post, kind?: 'tagged') =>
    router.push({ pathname: '/posts', params: { user: userId, start: post.id, ...(kind ? { kind } : {}) } });

  return (
    <View style={styles.wrap}>
      <SegmentedPicker<Tab>
        options={[
          { value: 'posts', label: t.titles.posts },
          { value: 'tagged', label: t.profile.tabs.tagged },
          { value: 'saved', label: t.profile.tabs.saved },
        ]}
        value={tab}
        onChange={setTab}
        accessibilityLabel={t.profile.tabs.a11y}
      />

      {tab === 'posts' &&
        (posts.length ? (
          <View style={styles.bleed}>
            <PostMasonry posts={posts} onOpen={(post) => open(post)} />
          </View>
        ) : (
          <Empty text={mine ? t.profile.tabs.noPostsMine : t.profile.tabs.noPosts} />
        ))}

      {tab === 'tagged' &&
        (tagged.length ? (
          <View style={styles.bleed}>
            <PostMasonry posts={tagged} onOpen={(post) => open(post, 'tagged')} />
          </View>
        ) : (
          <Empty text={mine ? t.profile.tabs.noTaggedMine : t.profile.tabs.noTagged(name)} />
        ))}

      {tab === 'saved' && <SavedVenues userId={userId} venues={saved} name={name} />}
    </View>
  );
}

/** To-HERE: gitmek istenen mekânlar (corner'ın listeleri gibi). Benimkinde aynı yeri kaydeden arkadaşlar, başkasınınkinde "İkiniz de". */
function SavedVenues({ userId, venues, name }: { userId: string; venues: Venue[]; name: string }) {
  const theme = useTheme();
  const t = useT();
  const { users, savedOf, isMutual } = useApp();
  const mine = userId === 'me';
  const mySaved = new Set(savedOf('me'));
  const friendsWhoSaved = (venueId: string) => users.filter((u) => u.id !== userId && isMutual(u.id) && savedOf(u.id).includes(venueId));

  if (!venues.length) return <Empty text={mine ? t.profile.tabs.noSavedMine : t.profile.tabs.noSaved(name)} />;

  return (
    <View style={{ gap: 10 }}>
      <Text style={[Type.footnote, { color: theme.textSecondary }]}>
        {mine ? t.profile.tabs.savedCountMine(venues.length) : t.profile.tabs.savedCount(name, genitive(name, t), venues.length)}
      </Text>
      <View style={styles.bleed}>
        <Masonry
          items={venues}
          keyOf={(venue) => venue.id}
          heightOf={(venue) => 1 / tileAspect(venue)}
          render={(venue) => <VenueTile venue={venue} friends={mine ? friendsWhoSaved(venue.id) : []} both={!mine && mySaved.has(venue.id)} />}
          accessibilityLabel={t.profile.tabs.venues(venues.length)}
        />
      </View>
    </View>
  );
}

/** Çok yatay kapaklar kırpılır: adın ve semtin sığacağı bir yükseklik kalsın. */
const tileAspect = (venue: Venue) => Math.min(imageAspect(venue.coverUri), 1.2);

function VenueTile({ venue, friends, both }: { venue: Venue; friends: User[]; both: boolean }) {
  const theme = useTheme();
  const t = useT();
  const firstNames = friends.map((u) => u.displayName.split(' ')[0]);
  const names = joinNames(firstNames, t);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/venue/[id]', params: { id: venue.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${venue.area}${both ? `, ${t.profile.tabs.bothA11y}` : ''}${friends.length ? `, ${t.profile.tabs.savedToo(names, alsoName(names, t))}` : ''}`}
      style={({ pressed }) => [styles.tile, { aspectRatio: tileAspect(venue), opacity: pressed ? 0.85 : 1 }]}>
      <Image source={{ uri: venue.coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
      {both ? (
        <View style={[styles.badge, styles.bothBadge, { backgroundColor: theme.accent }]}>
          <Text style={styles.badgeText}>{t.profile.tabs.both}</Text>
        </View>
      ) : friends.length > 0 ? (
        <View style={[styles.badge, styles.friendsBadge]}>
          <AvatarStack users={friends.slice(0, 2)} size={18} />
          <Text style={styles.badgeText} numberOfLines={1}>
            {friends.length === 1 ? alsoName(firstNames[0], t) : `${firstNames[0]} +${friends.length - 1}`}
          </Text>
        </View>
      ) : null}
      <View style={styles.tileText}>
        <Text style={styles.tileName} numberOfLines={2}>
          {venue.name}
        </Text>
        <Text style={styles.tileMeta} numberOfLines={1}>
          {venue.area} · {formatDistance(venue.distanceM, t)}
        </Text>
      </View>
    </Pressable>
  );
}

function Empty({ text }: { text: string }) {
  const theme = useTheme();
  return <Text style={[Type.subheadline, styles.empty, { color: theme.textSecondary }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  // Pinterest gibi kenarlara daha yakın.
  bleed: { marginHorizontal: -6 },
  empty: { textAlign: 'center', paddingVertical: 28, paddingHorizontal: 12 },
  tile: { width: '100%', borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end' },
  tileText: { padding: 12, gap: 1 },
  tileName: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 20 },
  tileMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
  badge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, borderRadius: 13 },
  friendsBadge: { paddingLeft: 4, paddingRight: 9, backgroundColor: 'rgba(0,0,0,0.5)', maxWidth: '90%' },
  bothBadge: { paddingHorizontal: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
