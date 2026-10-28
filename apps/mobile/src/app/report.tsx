import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Avatar } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { Text, TextInput } from '@/components/text';
import { TitleFonts, Type } from '@/constants/theme';
import { useApp, type ReportReason, type ReportTarget } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

const REASONS: ReportReason[] = ['taciz', 'tehdit', 'cinsel', 'nefret', 'spam', 'sahte', 'yas', 'diger'];
const NOTE_MAX = 500;
/** "Ekibe bildir"de ve "Başka bir şey"de ne olduğunu kısaca yazmak gerekir. */
const NOTE_MIN = 10;

/**
 * Bildir: bir kişiyi, paylaşımı ya da mesajı ekibe bildirir; ya da (Ayarlar › Ekibe bildir) hiçbirine bağlı olmayan
 * bir durumu anlatır: ör. engellediğin biri başka bir hesaptan rahatsız etmeye devam ediyor. Neden seçilir, istenirse
 * ne olduğu yazılır, kişi aynı anda engellenebilir. Bildirilen kişi bunu öğrenmez. Mesaj 04:00'te silinse de
 * bildirim anındaki içerik ekipte kanıt olarak kalır (veritabanı: reports).
 */
export default function ReportScreen() {
  const theme = useTheme();
  const t = useT();
  const r = t.report;
  const params = useLocalSearchParams<{ kind?: 'user' | 'post' | 'message' | 'other'; id?: string; user?: string }>();
  const { userById, posts, messages, blocked, block, submitReport } = useApp();
  const [reason, setReason] = useState<ReportReason>();
  const [note, setNote] = useState('');
  const [username, setUsername] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [sent, setSent] = useState(false);

  const general = params.kind === 'other' || !params.user || !params.id;
  const person = general ? undefined : userById(params.user!);
  const message = params.kind === 'message' ? messages.find((m) => m.id === params.id) : undefined;
  const post = params.kind === 'post' ? posts.find((p) => p.id === params.id) : undefined;
  const canBlock = Boolean(person && !blocked.includes(person.id));
  const noteRequired = general || reason === 'diger';
  const ready = Boolean(reason) && (!noteRequired || note.trim().length >= NOTE_MIN);

  const send = () => {
    if (!reason || !ready) return;
    const target: ReportTarget = general
      ? { kind: 'other', username: username.trim().replace(/^@/, '') || undefined }
      : { kind: params.kind as 'user' | 'post' | 'message', id: params.id!, userId: params.user! };
    submitReport(target, reason, note);
    if (person && canBlock && alsoBlock) block(person.id);
    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.done}>
        <Stack.Title {...TitleFonts}>{general ? r.titleGeneral : r.title}</Stack.Title>
        <Icon ios="checkmark.shield.fill" md="verified_user" size={44} color={theme.accent} />
        <Text style={[Type.title3, { color: theme.text, textAlign: 'center' }]}>{r.sentTitle}</Text>
        <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>{r.sentNote}</Text>
        <Text style={[Type.footnote, { color: theme.textSecondary, textAlign: 'center' }]}>{r.prototypeNote}</Text>
        <ActionButton title={t.report.close} variant="filled" fullWidth onPress={() => router.back()} style={styles.doneButton} />
      </View>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardDismissMode="interactive" contentContainerStyle={styles.scroll}>
      <Stack.Title {...TitleFonts}>{general ? r.titleGeneral : r.title}</Stack.Title>
      <PageColumn style={styles.content}>
        {general ? (
          <>
            <Text style={[Type.subheadline, { color: theme.textSecondary }]}>{r.generalIntro}</Text>
            <View style={[styles.field, { backgroundColor: theme.fill }]}>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder={r.usernamePlaceholder}
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel={r.usernameA11y}
                autoCapitalize="none"
                autoCorrect={false}
                style={[Type.body, styles.input, { color: theme.text }]}
              />
            </View>
          </>
        ) : (
          person && (
            <GlassCard style={styles.target}>
              <View style={styles.targetHead}>
                <Avatar name={person.displayName} color={person.avatarColor} uri={person.avatarUri} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
                    @{person.username}
                  </Text>
                  <Text style={[Type.footnote, { color: theme.textSecondary }]}>{r.kind[params.kind as 'user' | 'post' | 'message']}</Text>
                </View>
                {post && <Image source={{ uri: post.imageUri }} style={styles.postThumb} contentFit="cover" />}
              </View>
              {message && (
                <Text style={[Type.subheadline, { color: theme.text }]} numberOfLines={3}>
                  “{message.text}”
                </Text>
              )}
            </GlassCard>
          )
        )}

        <Text style={[Type.section, { color: theme.text }]}>{r.why}</Text>
        <GlassCard style={styles.list}>
          {REASONS.map((key, i) => {
            const on = reason === key;
            return (
              <View key={key}>
                {i > 0 && <View style={[styles.separator, { backgroundColor: theme.separator }]} />}
                <Pressable
                  onPress={() => setReason(key)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={({ pressed }) => [styles.reason, { opacity: pressed ? 0.6 : 1 }]}>
                  <Text style={[Type.body, { color: theme.text, flex: 1 }]}>{r.reasons[key]}</Text>
                  {on && <Icon ios="checkmark" md="check" size={16} color={theme.accentInk} />}
                </Pressable>
              </View>
            );
          })}
        </GlassCard>

        <View style={[styles.field, styles.noteField, { backgroundColor: theme.fill }]}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={noteRequired ? r.notePlaceholderRequired : r.notePlaceholder}
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel={r.noteA11y}
            maxLength={NOTE_MAX}
            multiline
            style={[Type.body, styles.noteInput, { color: theme.text }]}
          />
        </View>

        {canBlock && person && (
          <View style={styles.blockRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[Type.body, { color: theme.text }]}>{r.alsoBlock(`@${person.username}`)}</Text>
              <Text style={[Type.footnote, { color: theme.textSecondary }]}>{r.alsoBlockNote}</Text>
            </View>
            <Switch value={alsoBlock} onValueChange={setAlsoBlock} accessibilityLabel={r.alsoBlock(`@${person.username}`)} />
          </View>
        )}

        <View style={styles.notes}>
          <Text style={[Type.footnote, { color: theme.textSecondary }]}>{r.privateNote}</Text>
          <Text style={[Type.footnote, { color: theme.text, fontWeight: '600' }]}>{r.emergency}</Text>
        </View>

        <ActionButton title={r.send} variant="filled" fullWidth disabled={!ready} onPress={send} />
      </PageColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  content: { padding: 16, gap: 14 },
  target: { borderRadius: 20, padding: 14, gap: 10 },
  targetHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postThumb: { width: 44, height: 55, borderRadius: 8 },
  list: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 2 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46 },
  separator: { height: StyleSheet.hairlineWidth },
  field: { borderRadius: 16, paddingHorizontal: 14 },
  input: { minHeight: 46 },
  noteField: { paddingTop: 4, paddingBottom: 8 },
  noteInput: { minHeight: 88, maxHeight: 180, paddingTop: 10, textAlignVertical: 'top' },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notes: { gap: 6 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  doneButton: { marginTop: 12, alignSelf: 'stretch' },
});
