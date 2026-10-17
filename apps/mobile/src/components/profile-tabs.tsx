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
import { genitive, joinNames } from '@/lib/tr';

type Tab = 'posts' | 'tagged' | 'saved';

/**
 * Profilin alt bölümü (TASARIM.md §5.8, T-25): üç sekme. Paylaşımlar ve etiketlendiği paylaşımlar Pinterest
 * gibi ızgarada (dokununca dikey akış); To-HERE, kişinin gitmek istediği mekânlar (mekân sayfasında kaydedilir).
 * `posts`: profilde görünen kendi paylaşımları (gizlilik süzgeci ekrandan gelir).
 */
export function ProfileTabs({ userId, posts }: { userId: string; posts: Post[] }) {
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
          { value: 'posts', label: 'Paylaşımlar' },
          { value: 'tagged', label: 'Etiketlenenler' },
          { value: 'saved', label: 'To-HERE' },
        ]}
        value={tab}
        onChange={setTab}
        accessibilityLabel="Profil bölümleri"
      />

      {tab === 'posts' &&
        (posts.length ? (
          <View style={styles.bleed}>
            <PostMasonry posts={posts} onOpen={(post) => open(post)} />
          </View>
        ) : (
          <Empty text={mine ? 'Henüz paylaşım yok. Bir mekânda yer bildirip ilk fotoğrafını paylaş.' : 'Henüz paylaşım yok.'} />
        ))}

      {tab === 'tagged' &&
        (tagged.length ? (
          <View style={styles.bleed}>
            <PostMasonry posts={tagged} onOpen={(post) => open(post, 'tagged')} />
          </View>
        ) : (
          <Empty text={mine ? 'Arkadaşların seni bir paylaşımda etiketleyince burada görünür.' : `${name} henüz bir paylaşımda etiketlenmemiş.`} />
        ))}

      {tab === 'saved' && <SavedVenues userId={userId} venues={saved} name={name} />}
    </View>
  );
}

/** To-HERE: gitmek istenen mekânlar (corner'ın listeleri gibi). Benimkinde aynı yeri kaydeden arkadaşlar, başkasınınkinde "İkiniz de". */
function SavedVenues({ userId, venues, name }: { userId: string; venues: Venue[]; name: string }) {
  const theme = useTheme();
  const { users, savedOf, isMutual } = useApp();
  const mine = userId === 'me';
  const mySaved = new Set(savedOf('me'));
  const friendsWhoSaved = (venueId: string) => users.filter((u) => u.id !== userId && isMutual(u.id) && savedOf(u.id).includes(venueId));

  if (!venues.length) {
    return (
      <Empty
        text={
          mine
            ? 'Gitmek istediğin mekânları, mekân sayfasındaki kaydet düğmesiyle buraya ekle.'
            : `${name} henüz gitmek istediği bir mekân kaydetmemiş.`
        }
      />
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={[Type.footnote, { color: theme.textSecondary }]}>
        {mine ? `Gitmek istediğin ${venues.length} yer` : `${genitive(name)} gitmek istediği ${venues.length} yer`}
      </Text>
      <View style={styles.bleed}>
        <Masonry
          items={venues}
          keyOf={(venue) => venue.id}
          heightOf={(venue) => 1 / tileAspect(venue)}
          render={(venue) => <VenueTile venue={venue} friends={mine ? friendsWhoSaved(venue.id) : []} both={!mine && mySaved.has(venue.id)} />}
          accessibilityLabel={`${venues.length} mekân`}
        />
      </View>
    </View>
  );
}

/** Çok yatay kapaklar kırpılır: adın ve semtin sığacağı bir yükseklik kalsın. */
const tileAspect = (venue: Venue) => Math.min(imageAspect(venue.coverUri), 1.2);

function VenueTile({ venue, friends, both }: { venue: Venue; friends: User[]; both: boolean }) {
  const theme = useTheme();
  const firstNames = friends.map((u) => u.displayName.split(' ')[0]);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/venue/[id]', params: { id: venue.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${venue.area}${both ? ', ikiniz de gitmek istiyorsunuz' : ''}${friends.length ? `, ${joinNames(firstNames)} de kaydetti` : ''}`}
      style={({ pressed }) => [styles.tile, { aspectRatio: tileAspect(venue), opacity: pressed ? 0.85 : 1 }]}>
      <Image source={{ uri: venue.coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
      {both ? (
        <View style={[styles.badge, styles.bothBadge, { backgroundColor: theme.accent }]}>
          <Text style={styles.badgeText}>İkiniz de</Text>
        </View>
      ) : friends.length > 0 ? (
        <View style={[styles.badge, styles.friendsBadge]}>
          <AvatarStack users={friends.slice(0, 2)} size={18} />
          <Text style={styles.badgeText} numberOfLines={1}>
            {friends.length === 1 ? `${firstNames[0]} de` : `${firstNames[0]} +${friends.length - 1}`}
          </Text>
        </View>
      ) : null}
      <View style={styles.tileText}>
        <Text style={styles.tileName} numberOfLines={2}>
          {venue.name}
        </Text>
        <Text style={styles.tileMeta} numberOfLines={1}>
          {venue.area} · {formatDistance(venue.distanceM)}
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
