import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Avatar, messagePreview, minutesAgo } from '@/components/kit';
import { PageColumn } from '@/components/page-column';
import { Text } from '@/components/text';
import { Gap, Radius, TitleFonts, Type } from '@/constants/theme';
import type { Conversation, Message, User } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useNight } from '@/lib/night';

/**
 * Mesajlar (TASARIM.md §5.6, T-21): Instagram'ın mesaj kutusu gibi. Üstte kullanıcı adı ve yeni
 * mesaj; arama; notlar şeridi (HERE'de tanıdığın şu an hangi mekânda); "Mesajlar · İstekler";
 * kartsız düz liste ve öneriler. 04:00 sıfırlanması yalnızca en altta bir satır (K-16).
 */
export default function MessagesScreen() {
  const theme = useTheme();
  const { me, users, posts, conversations, messages, venueById, userById, checkIn, isUnread, isMutual, openDirect } = useApp();
  const { remaining } = useNight();
  const [query, setQuery] = useState('');
  const [note, setNote] = useState<string>();

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

  // Notlar şeridi: karşılıklı takipleştiklerin şu an hangi mekânda (Instagram notları gibi baloncukta).
  const mutuals = users.filter((u) => isMutual(u.id));
  const whereNow = (u: User) => venueById(posts.find((p) => p.userId === u.id && !p.anonAlias)?.venueId ?? '');
  const suggestions = mutuals.filter((u) => !conversations.some((c) => c.kind === 'direct' && c.userId === u.id) && matches(u.displayName));

  const openDm = (u: User) => router.push({ pathname: '/chat/[id]', params: { id: openDirect(u.id) } });
  const newMessage = () => {
    const names = mutuals.map((u) => u.displayName);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ title: 'Yeni mesaj', options: [...names, 'Vazgeç'], cancelButtonIndex: names.length }, (i) => {
        if (i < names.length) openDm(mutuals[i]);
      });
    } else {
      Alert.alert('Yeni mesaj', undefined, [...mutuals.map((u) => ({ text: u.displayName, onPress: () => openDm(u) })), { text: 'Vazgeç', style: 'cancel' }]);
    }
  };
  const editNote = () =>
    Platform.OS === 'ios'
      ? Alert.prompt('Not', 'Takipleştiklerin görür; 04:00’te silinir.', (value) => setNote(value?.trim() || undefined), 'plain-text', note ?? '')
      : Alert.alert('Not', 'Prototipte yalnızca iOS’ta.');

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
      <Stack.Title {...TitleFonts}>{me.username}</Stack.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="square.and.pencil" accessibilityLabel="Yeni mesaj" onPress={newMessage} />
      </Stack.Toolbar>
      <Stack.SearchBar placeholder="Ara" hideWhenScrolling={false} onChangeText={(e) => setQuery(e.nativeEvent.text)} />

      <PageColumn style={styles.content}>
        {!query && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.notes}>
            <NoteAvatar user={me} label="Notun" bubble={note ?? 'Bu gece neredesin?'} muted={!note} onPress={editNote} />
            {mutuals.map((u) => {
              const venue = whereNow(u);
              return (
                <NoteAvatar
                  key={u.id}
                  user={u}
                  label={u.displayName.split(' ')[0]}
                  bubble={venue?.name}
                  onPress={() => openDm(u)}
                />
              );
            })}
          </ScrollView>
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
    </ScrollView>
  );
}

/** Notlar şeridindeki kişi: avatarın üstünde küçük baloncuk (Instagram notları gibi). */
function NoteAvatar({ user, label, bubble, muted, onPress }: { user: User; label: string; bubble?: string; muted?: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={bubble ? `${label}: ${bubble}` : label} style={styles.note}>
      <View style={styles.noteBubbleSpace}>
        {bubble && (
          <View style={[styles.noteBubble, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[Type.caption, { color: muted ? theme.textSecondary : theme.text }]} numberOfLines={2}>
              {bubble}
            </Text>
          </View>
        )}
      </View>
      <Avatar name={user.displayName} color={user.avatarColor} uri={user.avatarUri} size={68} />
      <Text style={[Type.caption, { color: theme.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
          locked ? router.push({ pathname: '/venue/[id]', params: { id: venue.id } }) : router.push({ pathname: '/chat/[id]', params: { id: c.id } })
        }
        accessibilityLabel={`${venue.name} sohbeti${locked ? ', kilitli' : ''}`}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
        <Image source={{ uri: venue.coverUri }} style={styles.venuePhoto} contentFit="cover" />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[Type.subheadline, { color: theme.text, fontWeight: unread ? '700' : '600' }]} numberOfLines={1}>
            {venue.name}
          </Text>
          <Text style={[Type.footnote, { color: unread ? theme.text : theme.textSecondary, fontWeight: unread ? '600' : '400' }]} numberOfLines={1}>
            {locked ? 'Katılmak için orada olduğunu bildir' : last ? `${sender}: ${messagePreview(last)}${time}` : `${venue.here} kişi sohbette`}
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
        <Text style={[Type.footnote, { color: unread ? theme.text : theme.textSecondary, fontWeight: unread ? '600' : '400' }]} numberOfLines={1}>
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
  notes: { gap: 12, paddingHorizontal: Gap.page },
  note: { width: 84, alignItems: 'center', gap: 4 },
  noteBubbleSpace: { height: 46, justifyContent: 'flex-end', marginBottom: -10, zIndex: 1, alignSelf: 'stretch', alignItems: 'center' },
  noteBubble: { maxWidth: 84, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  listHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  subHeader: { marginTop: 20, marginBottom: 4 },
  requests: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  venuePhoto: { width: 56, height: 56, borderRadius: Radius.photo },
  unread: { width: 10, height: 10, borderRadius: 5 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
});
