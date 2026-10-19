import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/kit';
import { PageColumn } from '@/components/page-column';
import { Text, TextInput } from '@/components/text';
import { Gap, Type } from '@/constants/theme';
import type { User } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

/**
 * Yeni mesaj (TASARIM.md §5.6, T-21): Instagram'daki gibi "Kime:" alanı ve kişi listesi. Önce
 * karşılıklı takipleştiklerin (mesaj doğrudan gelen kutusuna düşer), sonra diğerleri (istek olarak gider, K-08).
 */
export default function NewMessageScreen() {
  const theme = useTheme();
  const t = useT();
  const { users, isMutual, following, openDirect } = useApp();
  const [query, setQuery] = useState('');

  const q = query.trim().toLocaleLowerCase('tr');
  const found = users.filter((u) => !q || u.displayName.toLocaleLowerCase('tr').includes(q) || u.username.includes(q));
  const mutual = found.filter((u) => isMutual(u.id));
  const others = found.filter((u) => !isMutual(u.id)).sort((a, b) => Number(following.has(b.id)) - Number(following.has(a.id)));

  const start = (u: User) => router.replace({ pathname: '/chat/[id]', params: { id: openDirect(u.id) } });

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
      <PageColumn style={styles.content}>
        <View style={[styles.to, { borderBottomColor: theme.separator }]}>
          <Text style={[Type.body, { color: theme.text, fontWeight: '600' }]}>{t.messages.newMessage.to}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.messages.newMessage.search}
            placeholderTextColor={theme.textSecondary}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={t.messages.newMessage.toA11y}
            style={[Type.body, styles.input, { color: theme.text }]}
          />
        </View>

        {mutual.length > 0 && <People title={t.messages.newMessage.mutuals} people={mutual} onPick={start} />}
        {others.length > 0 && (
          <People title={t.messages.newMessage.others} note={t.messages.newMessage.othersNote} people={others} onPick={start} />
        )}
        {found.length === 0 && <Text style={[Type.subheadline, { color: theme.textSecondary }]}>{t.messages.newMessage.noMatch(query)}</Text>}
      </PageColumn>
    </ScrollView>
  );
}

function People({ title, note, people, onPick }: { title: string; note?: string; people: User[]; onPick: (u: User) => void }) {
  const theme = useTheme();
  return (
    <View>
      <Text style={[Type.headline, { color: theme.text }]} accessibilityRole="header">
        {title}
      </Text>
      {note && <Text style={[Type.footnote, { color: theme.textSecondary }]}>{note}</Text>}
      <View style={{ marginTop: 6 }}>
        {people.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => onPick(u)}
            accessibilityRole="button"
            accessibilityLabel={`${u.displayName}, @${u.username}`}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
            <Avatar name={u.displayName} color={u.avatarColor} uri={u.avatarUri} size={48} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                {u.displayName}
              </Text>
              <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
                @{u.username}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  content: { paddingHorizontal: Gap.page, gap: 20 },
  to: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
});
