import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Avatar } from '@/components/kit';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import type { User } from '@/data/mock';
import { useTheme } from '@/hooks/use-theme';

/** X (Twitter) düzeni (K-15): görünen ad büyük, @kullanıcı adı küçük. İlgi alanı çipleri nötr. */
export function ProfileHeader({ user, followers, isPrivate }: { user: User; followers?: number; isPrivate?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Avatar name={user.displayName} color={user.avatarColor} uri={user.avatarUri} size={80} />
      <View style={{ gap: 2 }}>
        <View style={styles.nameRow}>
          <Text style={[Type.title2, { color: theme.text }]}>{user.displayName}</Text>
          {isPrivate && <Icon ios="lock.fill" md="lock" size={15} color={theme.textSecondary} />}
        </View>
        <Text style={[Type.subheadline, { color: theme.textSecondary }]}>@{user.username}</Text>
      </View>
      {user.bio ? <Text style={[Type.body, { color: theme.text }]}>{user.bio}</Text> : null}
      <Text style={[Type.subheadline, { color: theme.textSecondary }]}>
        <Text style={{ color: theme.text, fontWeight: '600' }}>{followers ?? user.followers}</Text> takipçi ·{' '}
        <Text style={{ color: theme.text, fontWeight: '600' }}>{user.following}</Text> takip
      </Text>
      <View style={styles.chips}>
        {user.interests.map((interest) => (
          <View key={interest} style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[Type.footnote, { color: theme.text, fontWeight: '600' }]}>{interest}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
});
