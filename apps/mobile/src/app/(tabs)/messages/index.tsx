import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { HereRefreshIndicator, useHereRefresh } from '@/components/here-refresh';
import { Icon } from '@/components/icon';
import { Avatar, VenueCard, messagePreview, minutesAgo } from '@/components/kit';
import { PageColumn } from '@/components/page-column';
import { HeaderButton, ScreenHeader } from '@/components/screen-header';
import { SearchField } from '@/components/search-field';
import { StatusBarBlur } from '@/components/status-bar-blur';
import { Text } from '@/components/text';
import { Gap, Radius, Type } from '@/constants/theme';
import type { Conversation, Message, User } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useNight } from '@/lib/night';

/**
 * Mesajlar (TASARIM.md §5.6, T-21): Instagram'ın mesaj kutusu gibi. Başlık çubuğu yok: kullanıcı adı,
 * yeni mesaj ve arama içerikle kayar. Hikâye şeridinin yerinde HERE'nin asıl odağı, mekânların grup
 * sohbetleri (ana sayfadaki mekân kartları; dokununca sohbet). Sonra "Mesajlar · İstekler", düz liste
 * ve öneriler. 04:00 sıfırlanması yalnızca en altta bir satır (K-16).
 */
export default function MessagesScreen() {
  const theme = useTheme();
  const { me, users, venues, conversations, messages, venueById, userById, checkIn, isUnread, isMutual, openDirect, tonightPostOf } = useApp();
  const { remaining } = useNight();
  const [query, setQuery] = useState('');

  const lastMessage = (c: Conversation) => messages.filter((m) => m.conversationId === c.id).at(-1);
  const titleOf = (c: Conversation) => (c.kind === 'venue' ? (venueById(c.venueId)?.name ?? '') : userById(c.userId).displayName);
  const matches = (text: string) => text.toLocaleLowerCase('tr').includes(query.trim().toLocaleLowerCase('tr'));

  const requests = conversations.filter((c) => c.kind === 'direct' && c.status === 'request');
  // Yer bildirdiğin mekânın sohbeti en üstte, gerisi son mesaja göre.
  const chats = conversations
    .filter((c) => (c.kind === 'venue' || c.status !== 'request') && matches(titleOf(c)))
    .sort((a, b) => {
      const pinned = (c: Conversation) => (c.kind === 'venue' && c.venueId === checkIn?.venueId ? 1 : 0);
      return pinned(b) - pinned(a) || (lastMessage(b)?.createdAt ?? 0) - (lastMessage(a)?.createdAt ?? 0);
    });

  const mutuals = users.filter((u) => isMutual(u.id));
  // Grup sohbetleri şeridi: yer bildirdiğin mekân önde, sonra tanıdığın olanlar ve kalabalık.
  const friendsAt = (venueId: string) => mutuals.filter((u) => tonightPostOf(u.id)?.venueId === venueId);
  const groups = [...venues].sort(
    (a, b) =>
      Number(b.id === checkIn?.venueId) - Number(a.id === checkIn?.venueId) ||
      friendsAt(b.id).length - friendsAt(a.id).length ||
      b.here - a.here,
  );
  const suggestions = mutuals
    .filter((u) => !conversations.some((c) => c.kind === 'direct' && c.userId === u.id) && matches(u.displayName))
    .slice(0, 5);

  const openDm = (u: User) => router.push({ pathname: '/chat/[id]', params: { id: openDirect(u.id) } });
  const { ref, refreshControl, angle, pull } = useHereRefresh();

  return (
    <View style={{ flex: 1 }} collapsable={false}>
      <Animated.ScrollView
        ref={ref}
        refreshControl={refreshControl}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}>
        <PageColumn style={styles.content}>
          <ScreenHeader
            title={me.username}
            right={
              <HeaderButton icon="square.and.pencil" md="edit_square" label="Yeni mesaj" onPress={() => router.push('/new-message')} />
            }
          />
          <SearchField value={query} onChangeText={setQuery} placeholder="Ara" />

          {!query && (
            <View style={styles.groups}>
              <Text style={[Type.headline, { color: theme.text }]} accessibilityRole="header">
                Grup sohbetleri
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.cards}>
                {groups.map((v) => (
                  <VenueCard
                    key={v.id}
                    venue={v}
                    width={220}
                    friends={friendsAt(v.id)}
                    onPress={() => router.push({ pathname: '/chat/[id]', params: { id: `c-${v.id}` } })}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.listHeader}>
            <Text style={[Type.headline, { color: theme.text, flex: 1 }]} accessibilityRole="header">
              Mesajlar
            </Text>
            <Pressable
              onPress={() => router.push('/messages/requests')}
              hitSlop={10}
              accessibilityRole="link"
              accessibilityLabel={`İstekler, ${requests.length}`}
              style={styles.requests}>
              <Text style={[Type.subheadline, { color: theme.textSecondary, fontWeight: '600' }]}>İstekler</Text>
              {requests.length > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                  <Text style={{ color: theme.onAccent, fontSize: 12, fontWeight: '700' }}>{requests.length}</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View>
            {chats.map((c) => (
              <ChatRow key={c.id} conversation={c} last={lastMessage(c)} unread={isUnread(c.id)} />
            ))}
            {chats.length === 0 && (
              <Text style={[Type.subheadline, { color: theme.textSecondary, paddingVertical: 12 }]}>“{query}” ile eşleşen sohbet yok.</Text>
            )}
          </View>

          {suggestions.length > 0 && (
            <View>
              <Text style={[Type.headline, styles.subHeader, { color: theme.text }]} accessibilityRole="header">
                Önerilenler
              </Text>
              {suggestions.map((u) => (
                <Pressable key={u.id} onPress={() => openDm(u)} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
                  <Avatar name={u.displayName} color={u.avatarColor} uri={u.avatarUri} size={56} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                      {u.displayName}
                    </Text>
                    <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
                      Mesaj göndermek için dokun
                    </Text>
                  </View>
                  <Icon ios="bubble.left" md="chat_bubble_outline" size={20} color={theme.textSecondary} />
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.footer} accessible>
            <Icon ios="hourglass" md="hourglass_top" size={12} color={theme.textSecondary} />
            <Text style={[Type.footnote, { color: theme.textSecondary }]}>Sohbetler {remaining} sonra sıfırlanır</Text>
          </View>
        </PageColumn>
      </Animated.ScrollView>
      <HereRefreshIndicator pull={pull} angle={angle} />
      <StatusBarBlur />
    </View>
  );
}

/** Tek sohbet satırı: kartsız, 56 pt avatar (mekân sohbetinde yuvarlatılmış kare fotoğraf), ad ve "son mesaj · zaman". */
function ChatRow({ conversation: c, last, unread: hasUnread }: { conversation: Conversation; last?: Message; unread: boolean }) {
  const theme = useTheme();
  const { venueById, userById, checkIn } = useApp();
  const time = last ? ` · ${minutesAgo(last.createdAt)}` : '';

  if (c.kind === 'venue') {
    const venue = venueById(c.venueId)!;
    const locked = checkIn?.venueId !== c.venueId;
    // Kilitli sohbetin mesajları görünmüyor; okunmamış gibi vurgulanmaz.
    const unread = hasUnread && !locked;
    const sender = last && last.senderId !== 'me' ? (last.anonAlias ?? userById(last.senderId).displayName.split(' ')[0]) : 'Sen';
    return (
      <Pressable
        onPress={() =>
          locked
            ? router.push({ pathname: '/venue/[id]', params: { id: venue.id } })
            : router.push({ pathname: '/chat/[id]', params: { id: c.id } })
        }
        accessibilityLabel={`${venue.name} sohbeti${locked ? ', kilitli' : ''}`}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
        <Image source={{ uri: venue.coverUri }} style={styles.venuePhoto} contentFit="cover" />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[Type.subheadline, { color: theme.text, fontWeight: unread ? '700' : '600' }]} numberOfLines={1}>
            {venue.name}
          </Text>
          <Text
            style={[Type.footnote, { color: unread ? theme.text : theme.textSecondary, fontWeight: unread ? '600' : '400' }]}
            numberOfLines={1}>
            {locked
              ? 'Katılmak için orada olduğunu bildir'
              : last
                ? `${sender}: ${messagePreview(last)}${time}`
                : `${venue.here} kişi sohbette`}
          </Text>
        </View>
        {locked ? <Icon ios="lock.fill" md="lock" size={15} color={theme.textSecondary} /> : <UnreadDot unread={unread} />}
      </Pressable>
    );
  }

  const user = userById(c.userId);
  const unread = hasUnread;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}
      accessibilityLabel={`${user.displayName}${unread ? ', okunmamış' : ''}`}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <Avatar name={user.displayName} color={user.avatarColor} uri={user.avatarUri} size={56} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Type.subheadline, { color: theme.text, fontWeight: unread ? '700' : '600' }]} numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text
          style={[Type.footnote, { color: unread ? theme.text : theme.textSecondary, fontWeight: unread ? '600' : '400' }]}
          numberOfLines={1}>
          {c.status === 'sent'
            ? 'İstek gönderildi · kabul edilmesini bekliyor'
            : last
              ? `${last.senderId === 'me' ? 'Sen: ' : ''}${messagePreview(last)}${time}`
              : 'Henüz mesaj yok'}
        </Text>
      </View>
      <UnreadDot unread={unread} />
    </Pressable>
  );
}

/** Okunmamışı fuşya nokta anlatır (§3.4); metin nötr kalır. */
function UnreadDot({ unread }: { unread: boolean }) {
  const theme = useTheme();
  return unread ? <View style={[styles.unread, { backgroundColor: theme.accent }]} accessibilityLabel="Okunmamış" /> : null;
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  content: { paddingHorizontal: Gap.page, paddingTop: 4, gap: Gap.block },
  bleed: { marginHorizontal: -Gap.page },
  groups: { gap: 10, marginTop: 4 },
  cards: { gap: 14, paddingHorizontal: Gap.page },
  listHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  subHeader: { marginTop: 20, marginBottom: 4 },
  requests: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  venuePhoto: { width: 56, height: 56, borderRadius: Radius.photo },
  unread: { width: 10, height: 10, borderRadius: 5 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
});
