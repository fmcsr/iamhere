import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Avatar, LiveCount, VenueIcon, messagePreview, minutesAgo } from '@/components/kit';
import { SegmentedPicker } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { Text } from '@/components/text';
import { Fonts, TitleFonts, Type } from '@/constants/theme';
import type { Conversation } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useNight } from '@/lib/night';

type Filter = 'tumu' | 'gruplar' | 'birebir';

/**
 * Mesajlar (TASARIM.md §5.6). İstekler listeyi kirletmez; başlıktaki "İstekler" düğmesinde.
 * Geri sayım satır başına değil, başlığın altında bir kez gösterilir.
 */
export default function MessagesScreen() {
  const theme = useTheme();
  const { conversations, messages, venueById, userById, checkIn, isUnread } = useApp();
  const { remaining } = useNight();
  const [filter, setFilter] = useState<Filter>('tumu');

  const requests = conversations.filter((c) => c.kind === 'direct' && c.status === 'request');
  const chats = conversations
    .filter((c) => c.kind === 'venue' || c.status !== 'request')
    .filter((c) => filter === 'tumu' || (filter === 'gruplar' ? c.kind === 'venue' : c.kind === 'direct'));
  const lastMessage = (c: Conversation) => messages.filter((m) => m.conversationId === c.id).at(-1);
  const current = checkIn ? venueById(checkIn.venueId) : undefined;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      <Stack.Title large {...TitleFonts}>Mesajlar</Stack.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          onPress={() => router.push('/messages/requests')}
          accessibilityLabel={`İstekler, ${requests.length}`}
          style={{ fontFamily: Fonts.medium }}>
          <Stack.Toolbar.Label>İstekler</Stack.Toolbar.Label>
          {requests.length > 0 && <Stack.Toolbar.Badge>{String(requests.length)}</Stack.Toolbar.Badge>}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <PageColumn style={styles.content}>
        <View style={styles.notice} accessible>
          <Icon ios="hourglass" md="hourglass_top" size={14} color={theme.textSecondary} />
          <Text style={[Type.footnote, { color: theme.textSecondary }]}>Sohbetler {remaining} sonra sıfırlanır</Text>
        </View>

        {current && (
          <GlassCard
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: `c-${current.id}` } })}
            accessibilityLabel={`Şu an buradasın: ${current.name}. Sohbete git`}
            style={styles.nowCard}>
            <Image source={{ uri: current.coverUri }} style={styles.nowImage} contentFit="cover" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[Type.footnote, { color: theme.textSecondary }]}>Şu an buradasın</Text>
              <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
                {current.name}
              </Text>
              <LiveCount count={current.here} suffix="kişi sohbette" />
            </View>
            <Icon ios="chevron.right" md="chevron_right" size={14} color={theme.textSecondary} />
          </GlassCard>
        )}

        <SegmentedPicker<Filter>
          options={[
            { value: 'tumu', label: 'Tümü' },
            { value: 'gruplar', label: 'Gruplar' },
            { value: 'birebir', label: 'Birebir' },
          ]}
          value={filter}
          onChange={setFilter}
          accessibilityLabel="Sohbet türü"
        />

        <GlassCard style={styles.list}>
          {chats.map((c, i) => {
            const last = lastMessage(c);
            const unread = isUnread(c.id);
            const separator = i > 0 && <View style={[styles.separator, { backgroundColor: theme.separator }]} />;
            if (c.kind === 'venue') {
              const venue = venueById(c.venueId)!;
              const locked = checkIn?.venueId !== c.venueId;
              const sender = last && last.senderId !== 'me' ? (last.anonAlias ?? userById(last.senderId).displayName.split(' ')[0]) : 'Sen';
              return (
                <View key={c.id}>
                  {separator}
                  <Pressable
                    onPress={() =>
                      locked
                        ? router.push({ pathname: '/venue/[id]', params: { id: venue.id } })
                        : router.push({ pathname: '/chat/[id]', params: { id: c.id } })
                    }
                    style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
                    <VenueIcon category={venue.category} size={52} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
                        {venue.name}
                      </Text>
                      <Text style={[Type.subheadline, { color: theme.textSecondary }]} numberOfLines={1}>
                        {locked ? 'Katılmak için orada olduğunu bildir' : last ? `${sender}: ${messagePreview(last)}` : 'Henüz mesaj yok'}
                      </Text>
                    </View>
                    {locked ? (
                      <Icon ios="lock.fill" md="lock" size={15} color={theme.textSecondary} />
                    ) : (
                      <Trailing time={last ? minutesAgo(last.createdAt) : ''} unread={unread} />
                    )}
                  </Pressable>
                </View>
              );
            }
            const user = userById(c.userId);
            return (
              <View key={c.id}>
                {separator}
                <Pressable
                  onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })}
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
                  <Avatar name={user.displayName} color={user.avatarColor} uri={user.avatarUri} size={52} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[Type.headline, { color: theme.text, fontWeight: unread ? '700' : '600' }]} numberOfLines={1}>
                      {user.displayName}
                    </Text>
                    <Text style={[Type.subheadline, { color: unread ? theme.text : theme.textSecondary }]} numberOfLines={1}>
                      {c.status === 'sent'
                        ? 'İstek gönderildi · kabul edilmesini bekliyor'
                        : last
                          ? `${last.senderId === 'me' ? 'Sen: ' : ''}${messagePreview(last)}`
                          : 'Henüz mesaj yok'}
                    </Text>
                  </View>
                  <Trailing time={last ? minutesAgo(last.createdAt) : ''} unread={unread} />
                </Pressable>
              </View>
            );
          })}
          {chats.length === 0 && (
            <Text style={[Type.subheadline, { color: theme.textSecondary, paddingVertical: 18, textAlign: 'center' }]}>
              {filter === 'gruplar' ? 'Bir mekânda yer bildirince grup sohbeti burada görünür.' : 'Henüz sohbet yok.'}
            </Text>
          )}
        </GlassCard>
      </PageColumn>
    </ScrollView>
  );
}

function Trailing({ time, unread }: { time: string; unread: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'flex-end', gap: 6 }}>
      {/* Okunmamışı fuşya nokta anlatır; saat cam kartta nötr kalır (§2.3 kural 5). */}
      <Text style={[Type.caption, { color: unread ? theme.text : theme.textSecondary, fontWeight: unread ? '600' : '400', fontVariant: ['tabular-nums'] }]}>{time}</Text>
      {unread ? <View style={[styles.unread, { backgroundColor: theme.accent }]} accessibilityLabel="Okunmamış" /> : <View style={styles.unreadSpace} />}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  content: { padding: 16, paddingTop: 4, gap: 14 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 12 },
  nowImage: { width: 56, height: 56, borderRadius: 14 },
  list: { borderRadius: 22, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
  unread: { width: 10, height: 10, borderRadius: 5 },
  unreadSpace: { height: 10 },
});
