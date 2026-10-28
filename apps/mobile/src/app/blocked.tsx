import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Avatar } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { Text } from '@/components/text';
import { TitleFonts, Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

/** Ayarlar › Güvenlik: engellediğin ya da sessize aldığın kişiler; tek dokunuşla geri alınır. */
export default function BlockedScreen() {
  const theme = useTheme();
  const t = useT();
  const s = t.settings.safety;
  const { list = 'blocked' } = useLocalSearchParams<{ list?: 'blocked' | 'muted' }>();
  const { blocked, muted, userById, unblock, toggleMute } = useApp();
  const isMuted = list === 'muted';
  const ids = isMuted ? muted : blocked;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      <Stack.Title {...TitleFonts}>{isMuted ? s.muted : s.blocked}</Stack.Title>
      <PageColumn style={styles.content}>
        <Text style={[Type.footnote, { color: theme.textSecondary }]}>{isMuted ? s.mutedNote : s.blockedNote}</Text>
        {ids.length === 0 ? (
          <Text style={[Type.subheadline, { color: theme.textSecondary, paddingVertical: 12 }]}>{s.empty}</Text>
        ) : (
          <GlassCard style={styles.list}>
            {ids.map((id, i) => {
              const user = userById(id);
              return (
                <View key={id}>
                  {i > 0 && <View style={[styles.separator, { backgroundColor: theme.separator }]} />}
                  <View style={styles.row}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/user/[username]', params: { username: user.username } })}
                      accessibilityRole="link"
                      style={styles.person}>
                      <Avatar name={user.displayName} color={user.avatarColor} uri={user.avatarUri} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
                          {user.displayName}
                        </Text>
                        <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
                          @{user.username}
                        </Text>
                      </View>
                    </Pressable>
                    <ActionButton
                      title={isMuted ? t.safety.unmute : t.safety.unblock}
                      variant="tonal"
                      size="regular"
                      onPress={() => (isMuted ? toggleMute(id) : unblock(id))}
                    />
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}
      </PageColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  content: { padding: 16, gap: 12 },
  list: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60 },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 50 },
});
