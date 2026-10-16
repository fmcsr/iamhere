import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Avatar } from '@/components/kit';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

/**
 * "Burada kimler var" — yarım yükseklikte açılan sayfa (iOS 26+ cam zemin). Takip ettiklerin önde.
 * Anonim kişiler sayıya dahil ama listede yok.
 */
export default function PeopleSheet() {
  const theme = useTheme();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const { venueById, peopleAt, following } = useApp();
  const venue = venueById(venueId);
  const people = peopleAt(venueId);
  if (!venue) return null;
  const others = Math.max(0, venue.here - people.length);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={{ gap: 2 }}>
        <Text style={[Type.title3, { color: theme.text }]}>Burada kimler var</Text>
        <Text style={[Type.subheadline, { color: theme.textSecondary }]}>
          {venue.name} · {venue.here} kişi
        </Text>
      </View>
      {people.map((u) => (
        <Pressable
          key={u.id}
          onPress={() => {
            router.back();
            router.push({ pathname: '/user/[username]', params: { username: u.username } });
          }}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
          <Avatar name={u.displayName} color={u.avatarColor} uri={u.avatarUri} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={[Type.headline, { color: theme.text }]}>{u.displayName}</Text>
            <Text style={[Type.footnote, { color: theme.textSecondary }]}>
              @{u.username}
              {following.has(u.id) ? ' · takip ediyorsun' : ''}
            </Text>
          </View>
          <Icon ios="chevron.right" md="chevron_right" size={13} color={theme.textSecondary} />
        </Pressable>
      ))}
      <View style={styles.note}>
        <Icon ios="eye.slash" md="visibility_off" size={15} color={theme.textSecondary} />
        <Text style={[Type.footnote, { color: theme.textSecondary, flex: 1 }]}>
          ve {others} kişi daha. Anonim olanlar ve görünürlüğünü kapatanlar listelenmez.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 28, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
});
