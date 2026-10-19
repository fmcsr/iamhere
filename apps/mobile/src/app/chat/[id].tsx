import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass, GlassCard, GlassGroup } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Avatar, AvatarStack, formatDistance, minutesAgo, showSafetyMenu } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { Text, TextInput } from '@/components/text';
import { Type } from '@/constants/theme';
import type { Message } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';
import { suggestedPlanTime, useNight } from '@/lib/night';

type Row = { message: Message; grouped: boolean };

const GROUP_WINDOW_MS = 5 * 60_000;

/**
 * Sohbet (TASARIM.md §5.7). Mekân sohbeti kalabalık olabileceği için balonsuz kompakt satırlar,
 * birebir sohbet balon. Yazma alanı mesajların üstünde yüzen cam; başlıkta 04:00'e kalan süre.
 */
export default function ChatScreen() {
  const theme = useTheme();
  const t = useT();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conversations, messages, venueById, userById, checkIn, canCheckIn, sendMessage, acceptRequest, declineRequest, markRead } = useApp();
  const { remaining, lastHour } = useNight(t);
  const [draft, setDraft] = useState('');
  const [composerHeight, setComposerHeight] = useState(64);
  const [inputHeight, setInputHeight] = useState(44);
  const keyboardOpen = useKeyboardOpen();
  const list = useRef<FlatList<Row>>(null);
  const sizes = useRef({ content: 0, layout: 0 });
  // Kısa sohbette kaydırma yapılmaz: aksi halde ilk mesajlar cam başlığın altına itilir.
  const scrollToEndIfNeeded = () => {
    if (sizes.current.content + headerHeight > sizes.current.layout) list.current?.scrollToEnd({ animated: false });
  };

  useEffect(() => {
    markRead(id);
  }, [id, markRead, messages.length]);

  // Her mekânın bir grup sohbeti var (c-<mekân>); listede kaydı olmasa da açılabilir (Mesajlar › Grup sohbetleri).
  const venueChat = id?.startsWith('c-v') && venueById(id.slice(2)) ? ({ id, kind: 'venue', venueId: id.slice(2) } as const) : undefined;
  const conversation = conversations.find((c) => c.id === id) ?? venueChat;
  if (!conversation) return <Text style={{ color: theme.text, padding: 16 }}>{t.messages.chat.notFound}</Text>;

  const thread = messages.filter((m) => m.conversationId === id);
  const isVenue = conversation.kind === 'venue';
  const venue = isVenue ? venueById(conversation.venueId) : undefined;
  const other = !isVenue ? userById(conversation.userId) : undefined;
  const title = venue?.name ?? other?.displayName ?? t.titles.chat;

  // Kurallar: mekân sohbeti yalnızca orada yer bildirenlere açık; gelen istek kabul edilmeden yanıtlanamaz;
  // gönderilen istekte karşı taraf kabul edene kadar ikinci mesaj yazılamaz (K-08).
  const lockedVenue = isVenue && checkIn?.venueId !== conversation.venueId;
  const incomingRequest = conversation.kind === 'direct' && conversation.status === 'request';
  const waitingAccept = conversation.kind === 'direct' && conversation.status === 'sent' && thread.some((m) => m.senderId === 'me');

  const rows: Row[] = thread.map((message, i) => {
    const prev = thread[i - 1];
    const grouped =
      !!prev && !prev.plan && !message.plan && prev.senderId === message.senderId && prev.anonAlias === message.anonAlias &&
      message.createdAt - prev.createdAt < GROUP_WINDOW_MS;
    return { message, grouped };
  });

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage(conversation.id, text);
    setDraft('');
  };

  const createPlan = () => {
    if (!venue) {
      Alert.alert(t.plan, t.messages.plan.venueOnly);
      return;
    }
    const post = (title: string) =>
      sendMessage(conversation.id, '', { emoji: '📍', title, time: suggestedPlanTime(new Date()), place: venue.name, going: 0 });
    if (Platform.OS === 'ios') {
      Alert.prompt(t.messages.plan.newTitle, t.messages.plan.newPrompt, (value) => value?.trim() && post(value.trim()), 'plain-text', '', 'default');
    } else {
      post(t.messages.plan.defaultTitle);
    }
  };

  const openAttachments = () => {
    const { attach } = t.messages.chat;
    const options = [t.plan, attach.photo, attach.meetingPoint];
    const handle = (index: number) => {
      if (index === 0) createPlan();
      else if (index < options.length) Alert.alert(options[index], attach.notYet);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: [...options, t.actions.cancel], cancelButtonIndex: options.length }, handle);
    } else {
      Alert.alert(attach.title, undefined, [...options.map((text, i) => ({ text, onPress: () => handle(i) })), { text: t.actions.cancel, style: 'cancel' }]);
    }
  };

  const header = (
    <>
      <Stack.Title asChild>
        <View
          style={styles.titleBox}
          accessible
          accessibilityRole="header"
          accessibilityLabel={t.messages.chat.titleA11y(title, remaining, venue && t.live.here(venue.here))}>
          <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.subtitle}>
            {venue && <Text style={[Type.caption, { color: theme.textSecondary }]}>{t.live.here(venue.here)} ·</Text>}
            <Icon ios="hourglass" md="hourglass_top" size={11} color={lastHour ? theme.accent : theme.textSecondary} />
            <Text style={[Type.caption, { color: theme.textSecondary, fontVariant: ['tabular-nums'] }]}>{remaining}</Text>
          </View>
        </View>
      </Stack.Title>
      <Stack.Toolbar placement="right">
        {venue ? (
          <Stack.Toolbar.Button
            icon="info.circle"
            accessibilityLabel={t.messages.chat.venueInfo}
            onPress={() => router.push({ pathname: '/venue/[id]', params: { id: venue.id } })}
          />
        ) : (
          <Stack.Toolbar.Button
            icon="person.crop.circle"
            accessibilityLabel={t.messages.chat.openProfile}
            onPress={() => other && router.push({ pathname: '/user/[username]', params: { username: other.username } })}
          />
        )}
      </Stack.Toolbar>
    </>
  );

  if (lockedVenue && venue) {
    const plans = thread.filter((m) => m.plan).length;
    // Sohbete yalnızca yer bildirerek, yer bildirimine de yalnızca mekânın yakınında izin var (K-17).
    const nearby = canCheckIn(venue.id);
    return (
      <View style={{ flex: 1 }}>
        {header}
        <View style={[styles.locked, { paddingTop: headerHeight + 24 }]}>
          <View style={styles.skeleton} accessibilityElementsHidden>
            {[0.7, 0.5, 0.8, 0.45].map((w, i) => (
              <View
                key={w}
                style={[styles.skeletonBubble, { width: `${w * 100}%`, backgroundColor: theme.fill, alignSelf: i % 2 ? 'flex-end' : 'flex-start' }]}
              />
            ))}
          </View>
          <Icon ios="lock.fill" md="lock" size={30} color={theme.text} />
          <Text style={[Type.title3, { color: theme.text }]}>{t.messages.chat.locked.title}</Text>
          <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>
            {nearby ? t.messages.chat.locked.checkInOnly : t.messages.chat.locked.tooFar(formatDistance(venue.distanceM, t))}
          </Text>
          <Text style={[Type.footnote, { color: theme.textSecondary }]}>
            {t.messages.chat.locked.stats(t.people(venue.here), thread.length, plans)}
          </Text>
        </View>
        <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
          <View style={styles.barInner}>
          <ActionButton
            title={nearby ? t.messages.chat.locked.checkInAndJoin : t.messages.chat.locked.mustBeThere}
            systemImage={nearby ? 'mappin.and.ellipse' : 'location.slash'}
            variant="glassProminent"
            fullWidth
            disabled={!nearby}
            // Alttan yer bildirme sayfası (T-26); iğne saplanınca bu sohbete geri dönülür.
            onPress={() => router.push({ pathname: '/check-in/[venueId]', params: { venueId: venue.id, from: 'chat' } })}
          />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const renderItem = ({ item: { message, grouped } }: { item: Row }) => {
    if (message.plan) return <PlanCard message={message} />;
    const mine = message.senderId === 'me';
    const spacing = { paddingTop: grouped ? 2 : 12 };
    if (mine) {
      return (
        <View style={[styles.mineWrap, spacing]}>
          {message.anonAlias && !grouped && (
            <Text style={[Type.caption, { color: theme.textSecondary }]}>{t.messages.chat.asAlias(message.anonAlias)}</Text>
          )}
          <View style={[styles.bubble, styles.mine, { backgroundColor: theme.accent }]}>
            <Text style={[Type.body, { color: theme.onAccent }]}>{message.text}</Text>
          </View>
        </View>
      );
    }
    const sender = userById(message.senderId);
    const anonymous = Boolean(message.anonAlias);
    const name = anonymous ? message.anonAlias! : sender.displayName;
    const openProfile = () => !anonymous && router.push({ pathname: '/user/[username]', params: { username: sender.username } });

    if (isVenue) {
      return (
        <Pressable onLongPress={() => showSafetyMenu(name)} style={[styles.compact, spacing]} accessibilityHint={t.messages.chat.reportHint}>
          <View style={styles.compactAvatar}>
            {!grouped && (
              <Pressable onPress={openProfile} disabled={anonymous} accessibilityLabel={name}>
                <Avatar name={sender.displayName} color={sender.avatarColor} uri={sender.avatarUri} size={28} anonymous={anonymous} />
              </Pressable>
            )}
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            {!grouped && (
              <Text style={[Type.footnote, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
                {name}
                <Text style={{ color: theme.textSecondary, fontWeight: '400' }}> · {minutesAgo(message.createdAt, t)}</Text>
              </Text>
            )}
            <Text style={[Type.body, { color: theme.text }]}>{message.text}</Text>
          </View>
        </Pressable>
      );
    }
    return (
      <Pressable onLongPress={() => showSafetyMenu(name)} style={[styles.theirsWrap, spacing]}>
        <View style={[styles.bubble, styles.theirs, { backgroundColor: theme.surface }]}>
          <Text style={[Type.body, { color: theme.text }]}>{message.text}</Text>
        </View>
      </Pressable>
    );
  };

  const canSend = draft.trim().length > 0;
  const composer = incomingRequest ? (
    <Glass style={styles.panel}>
      <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>
        {t.messages.chat.incomingRequest(other?.displayName ?? '')}
      </Text>
      <View style={styles.panelActions}>
        <ActionButton
          title={t.messages.requests.delete}
          variant="tonal"
          size="regular"
          fullWidth
          style={{ flex: 1 }}
          onPress={() => {
            declineRequest(conversation.id);
            router.back();
          }}
        />
        <ActionButton title={t.messages.requests.accept} size="regular" fullWidth style={{ flex: 1 }} onPress={() => acceptRequest(conversation.id)} />
      </View>
    </Glass>
  ) : waitingAccept ? (
    <Glass style={styles.panel}>
      <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>
        {t.messages.chat.waitingAccept(other?.displayName ?? '')}
      </Text>
    </Glass>
  ) : (
    <GlassGroup spacing={8} style={styles.composerRow}>
      <Pressable onPress={openAttachments} accessibilityRole="button" accessibilityLabel={t.messages.chat.attach.a11y}>
        <Glass style={styles.circle} interactive>
          <Icon ios="plus" md="add" size={20} color={theme.text} />
        </Glass>
      </Pressable>
      <Glass style={styles.inputCapsule}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={checkIn?.anonAlias && isVenue ? t.messages.chat.placeholderAs(checkIn.anonAlias) : t.messages.chat.placeholder}
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel={t.messages.chat.inputA11y}
          multiline
          // Metin silinince alan yeniden tek satıra insin (çok satırlı alan kendi kendine küçülmüyor).
          onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
          style={[Type.body, styles.input, { color: theme.text, height: Math.min(120, Math.max(44, inputHeight)) }]}
        />
      </Glass>
      <Pressable onPress={send} disabled={!canSend} accessibilityRole="button" accessibilityLabel={t.messages.chat.send} accessibilityState={{ disabled: !canSend }}>
        <Glass style={styles.circle} tint={canSend ? theme.accent : undefined} interactive>
          <Icon ios="arrow.up" md="arrow_upward" size={18} color={canSend ? theme.onAccent : theme.textSecondary} />
        </Glass>
      </Pressable>
    </GlassGroup>
  );

  return (
    <View style={{ flex: 1 }}>
      {header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Ters (inverted) liste iOS 26+ kaydırma kenarı efektini bozduğu için normal liste + sona kaydırma.
            Üst boşluğu (cam başlık) ve ev çubuğunu UIKit kendisi ekler; alttaki pay yüzen yazma alanı için. */}
        <FlatList
          ref={list}
          data={rows}
          keyExtractor={(row) => row.message.id}
          renderItem={renderItem}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          onContentSizeChange={(_, height) => {
            sizes.current.content = height;
            scrollToEndIfNeeded();
          }}
          onLayout={(e) => {
            sizes.current.layout = e.nativeEvent.layout.height;
            scrollToEndIfNeeded();
          }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: composerHeight + 8 - (keyboardOpen ? 0 : insets.bottom),
          }}
          ListHeaderComponent={
            <View style={styles.systemNote}>
              <Icon ios="hourglass" md="hourglass_top" size={13} color={theme.textSecondary} />
              <Text style={[Type.footnote, { color: theme.textSecondary, textAlign: 'center', flexShrink: 1 }]}>
                {isVenue ? t.messages.chat.venueNote : t.messages.chat.directNote(other?.username ?? '')}
              </Text>
            </View>
          }
        />
        <View
          onLayout={(e) => setComposerHeight(e.nativeEvent.layout.height)}
          style={[styles.composerWrap, { paddingBottom: keyboardOpen ? 8 : Math.max(insets.bottom, 8) }]}>
          {composer}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Plan kartı: "Ben de varım" → "Varsın" (geri alınabilir). */
function PlanCard({ message }: { message: Message }) {
  const theme = useTheme();
  const t = useT();
  const { joinedPlans, togglePlan, userById, users } = useApp();
  const plan = message.plan!;
  const joined = joinedPlans.has(message.id);
  const going = plan.going + (joined ? 1 : 0);
  const author = message.senderId === 'me' ? null : userById(message.senderId).displayName.split(' ')[0];
  return (
    <GlassCard style={styles.plan}>
      <Text style={[Type.caption, { color: theme.textSecondary }]}>{t.messages.plan.shared(author, minutesAgo(message.createdAt, t))}</Text>
      <View style={styles.planHead}>
        <Text style={styles.planEmoji}>{plan.emoji}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[Type.headline, { color: theme.text }]}>{plan.title}</Text>
          <Text style={[Type.subheadline, { color: theme.textSecondary }]}>
            {plan.time} · {plan.place}
          </Text>
        </View>
      </View>
      {message.text ? <Text style={[Type.body, { color: theme.text }]}>{message.text}</Text> : null}
      <View style={styles.planFoot}>
        {going > 0 && <AvatarStack users={users.slice(0, Math.min(3, going))} size={24} />}
        <Text style={[Type.footnote, { color: theme.textSecondary, flex: 1 }]}>
          {going > 0 ? t.messages.plan.going(t.people(going)) : t.messages.plan.beFirst}
        </Text>
        <ActionButton
          title={joined ? t.messages.plan.joined : t.messages.plan.join}
          systemImage={joined ? 'checkmark' : undefined}
          variant={joined ? 'filled' : 'tonal'}
          size="regular"
          onPress={() => togglePlan(message.id)}
        />
      </View>
    </GlassCard>
  );
}

function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}

const styles = StyleSheet.create({
  titleBox: { alignItems: 'center', maxWidth: 240 },
  subtitle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locked: { flex: 1, alignItems: 'center', gap: 10, paddingHorizontal: 32 },
  skeleton: { alignSelf: 'stretch', gap: 10, marginBottom: 24, opacity: 0.7 },
  skeletonBubble: { height: 36, borderRadius: 18 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 8, alignItems: 'center' },
  barInner: { width: '100%', maxWidth: 600 },
  mineWrap: { alignSelf: 'flex-end', maxWidth: '80%', alignItems: 'flex-end', gap: 2 },
  theirsWrap: { alignSelf: 'flex-start', maxWidth: '80%' },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  mine: { borderBottomRightRadius: 6 },
  theirs: { borderBottomLeftRadius: 6 },
  compact: { flexDirection: 'row', gap: 10, maxWidth: 640 },
  compactAvatar: { width: 28 },
  systemNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 24 },
  composerWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingTop: 6 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  inputCapsule: { flex: 1, minHeight: 44, borderRadius: 22, justifyContent: 'center', paddingHorizontal: 16 },
  input: { paddingTop: 10, paddingBottom: 10, maxHeight: 120 },
  panel: { borderRadius: 26, padding: 14, gap: 12 },
  panelActions: { flexDirection: 'row', gap: 10 },
  plan: { borderRadius: 24, padding: 14, gap: 10, marginTop: 12, maxWidth: 520 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planEmoji: { fontSize: 30 },
  planFoot: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
