import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Avatar, minutesAgo, showSafetyMenu } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

/** Mesaj istekleri (K-08): kabul edilene kadar yanıt yazılamaz; silmek sessizdir. */
export default function RequestsScreen() {
  const theme = useTheme();
  const { conversations, messages, userById, followsMe, acceptRequest, declineRequest } = useApp();
  const requests = conversations.filter((c) => c.kind === 'direct' && c.status === 'request');

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      <PageColumn style={styles.content}>
        <Text style={[Type.footnote, { color: theme.textSecondary }]}>
          Karşılıklı takipleşmediğin kişilerin ilk mesajı buraya düşer. Kabul edersen sohbet gelen kutuna taşınır; silersen karşı
          taraf bunu bilmez. Kabul etmediğin istekler 04:00’te silinir.
        </Text>

        {requests.map((c) => {
          if (c.kind !== 'direct') return null;
          const user = userById(c.userId);
          const last = messages.filter((m) => m.conversationId === c.id).at(-1);
          return (
            <GlassCard key={c.id} style={styles.card}>
              <View style={styles.header}>
                <Pressable
                  onPress={() => router.push({ pathname: '/user/[username]', params: { username: user.username } })}
                  accessibilityRole="link"
                  style={styles.who}>
                  <Avatar name={user.displayName} color={user.avatarColor} uri={user.avatarUri} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
                      {user.displayName}
                    </Text>
                    <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
                      @{user.username} · {followsMe(user.id) ? 'Seni takip ediyor' : 'Takipleşmiyorsunuz'}
                    </Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => showSafetyMenu(user.displayName)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Diğer seçenekler">
                  <Icon ios="ellipsis" md="more_horiz" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
              {last && (
                <View style={[styles.bubble, { backgroundColor: theme.fill }]}>
                  <Text style={[Type.body, { color: theme.text }]}>{last.text}</Text>
                  <Text style={[Type.caption, { color: theme.textSecondary }]}>{minutesAgo(last.createdAt)}</Text>
                </View>
              )}
              <View style={styles.actions}>
                <ActionButton title="Sil" variant="tonal" size="regular" fullWidth style={{ flex: 1 }} onPress={() => declineRequest(c.id)} />
                <ActionButton title="Kabul et" variant="filled" size="regular" fullWidth style={{ flex: 1 }} onPress={() => acceptRequest(c.id)} />
              </View>
            </GlassCard>
          );
        })}

        {requests.length === 0 && (
          <View style={styles.empty}>
            <Icon ios="tray" md="inbox" size={34} color={theme.textSecondary} />
            <Text style={[Type.headline, { color: theme.text }]}>Bekleyen istek yok</Text>
            <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>
              Yeni bir istek geldiğinde Mesajlar simgesinin köşesinde küçük bir nokta görürsün.
            </Text>
          </View>
        )}
      </PageColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  content: { padding: 16, gap: 14 },
  card: { borderRadius: 22, padding: 14, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  bubble: { borderRadius: 18, borderTopLeftRadius: 6, padding: 12, gap: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48 },
});
