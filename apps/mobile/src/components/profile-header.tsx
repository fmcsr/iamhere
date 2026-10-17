import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Avatar } from '@/components/kit';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import type { User } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

/**
 * Profil kimliği (X düzeni, K-15). Avatar kapağın üstüne biner; sağında küçük eylem düğmeleri
 * (kendi profilinde "Düzenle", başkasınınkinde Mesaj ve Takip et). Görünen ad büyük, @kullanıcı adı küçük.
 * Sayılar tek satırda (Strava gibi); takipçi ve takip dokununca liste açılır. İlgi alanı çipleri nötr.
 */
export function ProfileHeader({
  user,
  ring,
  isPrivate,
  followers,
  following,
  nights,
  onFollowers,
  onFollowing,
  actions,
}: {
  user: User;
  /** Fuşya halka: şu an bir mekânda. */
  ring?: boolean;
  isPrivate?: boolean;
  followers: number;
  following: number;
  /** Son 30 gündeki gece sayısı (görünmüyorsa verilmez). */
  nights?: number;
  onFollowers: () => void;
  onFollowing: () => void;
  actions?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={[styles.avatarFrame, { backgroundColor: theme.background }]}>
          <Avatar name={user.displayName} color={user.avatarColor} uri={user.avatarUri} size={ring ? 86 : 92} ring={ring} />
        </View>
        <View style={styles.actions}>{actions}</View>
      </View>

      <View style={{ gap: 2 }}>
        <View style={styles.nameRow}>
          <Text style={[Type.title2, { color: theme.text }]}>{user.displayName}</Text>
          {isPrivate && <Icon ios="lock.fill" md="lock" size={15} color={theme.textSecondary} />}
        </View>
        <Text style={[Type.subheadline, { color: theme.textSecondary }]}>@{user.username}</Text>
      </View>
      {user.bio ? <Text style={[Type.body, { color: theme.text }]}>{user.bio}</Text> : null}

      <View style={styles.counts}>
        <Count value={followers} label="takipçi" onPress={onFollowers} />
        <Count value={following} label="takip" onPress={onFollowing} />
        {nights !== undefined && <Count value={nights} label="gece · 30 gün" />}
      </View>

      {user.interests.length > 0 && (
        <View style={styles.chips}>
          {user.interests.map((interest) => (
            <View key={interest} style={[styles.chip, { backgroundColor: theme.fill }]}>
              <Text style={[Type.footnote, { color: theme.text, fontWeight: '600' }]}>{interest}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Count({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  const theme = useTheme();
  const body = (
    <>
      <Text style={[styles.countValue, { color: theme.text }]}>{value}</Text>
      <Text style={[Type.footnote, { color: theme.textSecondary }]}>{label}</Text>
    </>
  );
  if (!onPress) return <View accessible>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${value} ${label}`} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  // Avatar kapağın alt kenarına biner.
  topRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -52 },
  avatarFrame: { padding: 3, borderRadius: 52 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  counts: { flexDirection: 'row', gap: 26 },
  countValue: { fontSize: 19, fontWeight: '700', fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
});
