import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { AvatarStack, LiveCount, PostCard, VenueIcon, formatDistance, messagePreview, minutesAgo } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { CATEGORY_LABEL, CHECK_IN_RADIUS_M } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

/**
 * Mekân sayfası (TASARIM.md §5.4): kapak fotoğrafı cam geri düğmesinin altında, "kimler burada",
 * bu gecenin fotoğrafları, sohbet önizlemesi ve altta duruma göre değişen tek cam düğme.
 */
export default function VenueScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Izgara hücreleri ölçülen genişlikten hesaplanır (yüzde genişlik görselleri çizdirmiyordu).
  const [gridWidth, setGridWidth] = useState(0);
  const cell = Math.floor((gridWidth - 8) / 3);
  const { venueById, posts, messages, checkIn, following, peopleAt, savedOf, toggleSaved } = useApp();
  const venue = venueById(id);

  if (!venue) return <Text style={{ color: theme.text, padding: 16 }}>Mekân bulunamadı.</Text>;

  const isHere = checkIn?.venueId === venue.id;
  // To-HERE: gitmek istediğin yerler listesi (profilin üçüncü sekmesi).
  const isSaved = savedOf('me').includes(venue.id);
  const tooFar = venue.distanceM > CHECK_IN_RADIUS_M;
  const venuePosts = posts.filter(
    (p) => p.venueId === venue.id && (p.audience !== 'takipciler' || p.userId === 'me' || following.has(p.userId)),
  );
  const photos = [...new Set([...venuePosts.flatMap((p) => (p.imageUri ? [p.imageUri] : [])), ...venue.nightPhotos])].slice(0, 6);
  const people = peopleAt(venue.id);
  const chat = messages.filter((m) => m.conversationId === `c-${venue.id}`);
  const lastChat = chat.at(-1);
  const plans = chat.filter((m) => m.plan).length;

  const primary = isHere
    ? { title: 'Sohbete katıl', icon: 'bubble.left.and.bubble.right.fill' as const, onPress: () => router.push({ pathname: '/chat/[id]', params: { id: `c-${venue.id}` } }) }
    : tooFar
      ? { title: `Yol tarifi · ${formatDistance(venue.distanceM)}`, icon: 'arrow.triangle.turn.up.right.diamond.fill' as const, onPress: () => Linking.openURL(`https://maps.apple.com/?daddr=${venue.latitude},${venue.longitude}`) }
      : { title: 'Buradayım', icon: 'mappin.and.ellipse' as const, onPress: () => router.push({ pathname: '/compose', params: { venueId: venue.id } }) };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: 120 }}>
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon={isSaved ? 'bookmark.fill' : 'bookmark'}
            tintColor={isSaved ? theme.accent : undefined}
            selected={isSaved}
            accessibilityLabel={isSaved ? 'To-HERE listenden çıkar' : 'To-HERE listene ekle'}
            onPress={() => toggleSaved(venue.id)}
          />
          <Stack.Toolbar.Button
            icon="square.and.arrow.up"
            accessibilityLabel="Mekânı paylaş"
            onPress={() => Share.share({ message: `Bu gece ${venue.name}'dayız · HERE #iamhere` })}
          />
        </Stack.Toolbar>

        <Image source={{ uri: venue.coverUri }} style={styles.cover} contentFit="cover" transition={200} accessibilityLabel={`${venue.name} kapak fotoğrafı`} />

        <PageColumn style={styles.body}>
          <View style={styles.titleRow}>
            <VenueIcon category={venue.category} size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[Type.title2, { color: theme.text }]}>{venue.name}</Text>
              <Text style={[Type.subheadline, { color: theme.textSecondary }]}>
                {CATEGORY_LABEL[venue.category]} · {venue.area} · {formatDistance(venue.distanceM)}
              </Text>
            </View>
          </View>
          {venue.event && (
            <View style={styles.event}>
              <Icon ios="sparkles" md="auto_awesome" size={15} color={theme.text} />
              <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]}>Bu gece: {venue.event}</Text>
            </View>
          )}

          <GlassCard
            onPress={() => router.push({ pathname: '/people/[venueId]', params: { venueId: venue.id } })}
            accessibilityLabel={`${venue.here} kişi şu an burada. Listeyi aç`}
            style={styles.hereRow}>
            <LiveCount count={venue.here} suffix="kişi şu an burada" />
            <View style={{ flex: 1 }} />
            {people.length > 0 && <AvatarStack users={people.slice(0, 4)} />}
            <Icon ios="chevron.right" md="chevron_right" size={13} color={theme.textSecondary} />
          </GlassCard>

          {photos.length > 0 && (
            <View style={styles.section}>
              <Text style={[Type.section, { color: theme.text }]}>Fotoğraflar</Text>
              <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
                {photos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={{ width: cell, height: cell }} contentFit="cover" transition={150} accessibilityLabel="Bu geceden fotoğraf" />
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[Type.section, { color: theme.text }]}>Mekân sohbeti</Text>
            <GlassCard onPress={primary.onPress} disabled={!isHere} style={styles.chatCard}>
              <View style={styles.chatMeta}>
                <Icon ios={isHere ? 'bubble.left.and.bubble.right.fill' : 'lock.fill'} md={isHere ? 'forum' : 'lock'} size={16} color={theme.text} />
                <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600', flex: 1 }]}>
                  {venue.here} kişi{lastChat ? ` · son mesaj ${minutesAgo(lastChat.createdAt)}` : ''}
                  {plans > 0 ? ` · ${plans} aktif plan` : ''}
                </Text>
              </View>
              {isHere && lastChat ? (
                <Text style={[Type.subheadline, { color: theme.textSecondary }]} numberOfLines={2}>
                  {messagePreview(lastChat)}
                </Text>
              ) : (
                <View style={styles.skeleton} accessibilityLabel="Sohbet kilitli">
                  {[0.82, 0.56, 0.7].map((w, i) => (
                    <View key={w} style={[styles.skeletonLine, { width: `${w * 100}%`, backgroundColor: theme.fill, alignSelf: i === 1 ? 'flex-end' : 'flex-start' }]} />
                  ))}
                  <Text style={[Type.footnote, { color: theme.textSecondary }]}>
                    Yalnızca burada yer bildirenlere açık
                  </Text>
                </View>
              )}
            </GlassCard>
          </View>

          <View style={styles.section}>
            <Text style={[Type.section, { color: theme.text }]}>Paylaşımlar · {venuePosts.length}</Text>
            {venuePosts.length === 0 && (
              <Text style={[Type.subheadline, { color: theme.textSecondary }]}>Henüz paylaşım yok. İlk sen paylaş.</Text>
            )}
            {venuePosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </View>
        </PageColumn>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBar} pointerEvents="box-none">
        <View style={styles.barInner}>
        <ActionButton
          title={primary.title}
          systemImage={primary.icon}
          variant={tooFar && !isHere ? 'glass' : 'glassProminent'}
          fullWidth
          onPress={primary.onPress}
        />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', aspectRatio: 16 / 10, maxHeight: 420 },
  body: { padding: 16, gap: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  event: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hereRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18 },
  section: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, borderRadius: 18, overflow: 'hidden' },
  chatCard: { borderRadius: 22, padding: 14, gap: 10 },
  chatMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skeleton: { gap: 8 },
  skeletonLine: { height: 14, borderRadius: 7 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 8, alignItems: 'center' },
  barInner: { width: '100%', maxWidth: 600 },
});
