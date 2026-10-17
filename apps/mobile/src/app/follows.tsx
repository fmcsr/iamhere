import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/kit';
import { SegmentedPicker } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { Pill } from '@/components/pill';
import { SearchField } from '@/components/search-field';
import { Text } from '@/components/text';
import { Gap, TitleFonts, Type } from '@/constants/theme';
import type { User } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

type Tab = 'followers' | 'following';

/**
 * Takipçiler ve takip edilenler (Instagram gibi): üstte iki sekme, arama, kişi listesi. Her satırda takip
 * durumu küçük kapsülde; satıra dokununca profil açılır. Karşılıklı takipleştiklerin önde.
 */
export default function FollowsScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ user?: string; tab?: Tab }>();
  const userId = params.user ?? 'me';
  const { userById, followersOf, followingOf, following, followsMe, isMutual, toggleFollow, followRequests, toggleFollowRequest } = useApp();
  const [tab, setTab] = useState<Tab>(params.tab === 'following' ? 'following' : 'followers');
  const [query, setQuery] = useState('');

  const owner = userById(userId);
  const followers = followersOf(userId);
  const followingList = followingOf(userId);
  const q = query.trim().toLocaleLowerCase('tr');
  const people = (tab === 'followers' ? followers : followingList)
    .filter((u) => !q || u.displayName.toLocaleLowerCase('tr').includes(q) || u.username.includes(q))
    .sort((a, b) => Number(isMutual(b.id)) - Number(isMutual(a.id)) || a.displayName.localeCompare(b.displayName, 'tr'));

  const toggle = (u: User) => {
    if (following.has(u.id)) {
      Alert.alert(`@${u.username} takibi bırakılsın mı?`, undefined, [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Takibi bırak', style: 'destructive', onPress: () => toggleFollow(u.id) },
      ]);
    } else if (u.isPrivate) {
      toggleFollowRequest(u.id);
    } else {
      toggleFollow(u.id);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
      <Stack.Title {...TitleFonts}>{userId === 'me' ? owner.username : `@${owner.username}`}</Stack.Title>
      <PageColumn style={styles.content}>
        <SegmentedPicker<Tab>
          options={[
            { value: 'followers', label: `${followers.length} takipçi` },
            { value: 'following', label: `${followingList.length} takip` },
          ]}
          value={tab}
          onChange={setTab}
          accessibilityLabel="Liste"
        />
        <SearchField value={query} onChangeText={setQuery} placeholder="Ara" />

        <View>
          {people.map((u) => {
            const isMe = u.id === 'me';
            const iFollow = following.has(u.id);
            const requested = followRequests.has(u.id);
            const hint = isMe ? 'Sen' : isMutual(u.id) ? 'Karşılıklı takipleşiyorsunuz' : followsMe(u.id) ? 'Seni takip ediyor' : `@${u.username}`;
            return (
              <Pressable
                key={u.id}
                onPress={() => (isMe ? router.navigate('/profile') : router.push({ pathname: '/user/[username]', params: { username: u.username } }))}
                accessibilityRole="button"
                accessibilityLabel={`${u.displayName}, ${hint}`}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
                <Avatar name={u.displayName} color={u.avatarColor} uri={u.avatarUri} size={52} />
                <View style={styles.grow}>
                  <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                    {u.displayName}
                  </Text>
                  <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
                    {hint}
                  </Text>
                </View>
                {!isMe && (
                  <Pill
                    title={iFollow ? 'Takip ediliyor' : requested ? 'İstek gönderildi' : followsMe(u.id) ? 'Geri takip et' : 'Takip et'}
                    tone={iFollow || requested ? 'fill' : 'ink'}
                    onPress={() => toggle(u)}
                  />
                )}
              </Pressable>
            );
          })}
          {people.length === 0 && (
            <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center', paddingVertical: 24 }]}>
              {q ? `“${query}” adında kimse yok.` : tab === 'followers' ? 'Henüz takipçi yok.' : 'Henüz kimseyi takip etmiyor.'}
            </Text>
          )}
        </View>
      </PageColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  content: { paddingHorizontal: Gap.page, paddingTop: 8, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  grow: { flex: 1, gap: 1, minWidth: 0 },
});
