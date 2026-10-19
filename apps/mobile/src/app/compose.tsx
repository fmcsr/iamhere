import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { LiveCount, VenueIcon, formatDistance } from '@/components/kit';
import { ActionButton, MenuPicker } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { Text, TextInput } from '@/components/text';
import { Type } from '@/constants/theme';
import { type Audience } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

const MAX = 280;

/**
 * Yer bildirme + paylaşım (TASARIM.md §5.3): tek ekranlık sayfa, sihirbaz değil. Mekân sabit,
 * fotoğraf ve metin isteğe bağlı, kitle son seçimi hatırlar. Altta tek cam-fuşya düğme.
 */
export default function ComposeScreen() {
  const theme = useTheme();
  const t = useT();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const { venueById, settings, doCheckIn, canCheckIn } = useApp();
  const venue = venueById(venueId);

  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string>();
  const [audience, setAudience] = useState<Audience>(settings.lastAudience);
  const [joinChat, setJoinChat] = useState(true);

  if (!venue) return <Text style={{ color: theme.text, padding: 16 }}>{t.messages.compose.notFound}</Text>;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 5] });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // Yer bildirimi yalnızca mekânın 300 m yakınında (K-17); uzaktaysan sayfa açıklar, düğme kapalı kalır.
  const nearby = canCheckIn(venue.id);

  const submit = () => {
    const conversationId = doCheckIn({ venueId: venue.id, text, imageUri, audience });
    if (!conversationId) return;
    if (joinChat) router.replace({ pathname: '/chat/[id]', params: { id: conversationId } });
    else router.back();
  };

  const posting = Boolean(text.trim() || imageUri);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" accessibilityLabel={t.actions.cancel} onPress={() => router.back()} />
      </Stack.Toolbar>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}>
          <PageColumn style={styles.content}>
            <View style={styles.venueRow}>
              <VenueIcon category={venue.category} size={52} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[Type.title3, { color: theme.text }]} numberOfLines={1}>
                  {venue.name}
                </Text>
                <Text style={[Type.footnote, { color: theme.textSecondary }]}>
                  {t.categories[venue.category]} · {formatDistance(venue.distanceM, t)}
                </Text>
              </View>
              <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel={t.messages.compose.changeVenueA11y}>
                <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]}>{t.messages.compose.change}</Text>
              </Pressable>
            </View>

            {!nearby && (
              <GlassCard style={styles.farNote}>
                <Icon ios="location.slash" md="location_off" size={20} color={theme.text} />
                <Text style={[Type.subheadline, { color: theme.text, flex: 1 }]}>{t.messages.compose.tooFar(formatDistance(venue.distanceM, t))}</Text>
              </GlassCard>
            )}

            {imageUri ? (
              <View>
                <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" accessibilityLabel={t.messages.compose.selectedPhoto} />
                <Pressable
                  onPress={() => setImageUri(undefined)}
                  style={styles.remove}
                  accessibilityRole="button"
                  accessibilityLabel={t.messages.compose.removePhoto}
                  hitSlop={8}>
                  <Icon ios="xmark" md="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={pickImage}
                style={({ pressed }) => [styles.addPhoto, { borderColor: theme.separator, backgroundColor: theme.fill, opacity: pressed ? 0.7 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={t.messages.compose.addPhotoA11y}>
                <Icon ios="camera" md="photo_camera" size={28} color={theme.text} />
                <Text style={[Type.headline, { color: theme.text }]}>{t.messages.compose.addPhoto}</Text>
                <Text style={[Type.footnote, { color: theme.textSecondary }]}>{t.messages.compose.optional}</Text>
              </Pressable>
            )}

            <GlassCard style={styles.field}>
              <TextInput
                value={text}
                onChangeText={(value) => setText(value.slice(0, MAX))}
                placeholder={t.messages.compose.placeholder}
                placeholderTextColor={theme.textSecondary}
                multiline
                accessibilityLabel={t.messages.compose.textA11y}
                style={[Type.body, styles.input, { color: theme.text }]}
              />
              <Text style={[Type.caption, { color: theme.textSecondary, alignSelf: 'flex-end', fontVariant: ['tabular-nums'] }]}>
                {text.length}/{MAX}
              </Text>
            </GlassCard>

            <GlassCard style={styles.group}>
              <View style={styles.groupRow}>
                <Icon ios="eye" md="visibility" size={18} color={theme.text} />
                <Text style={[Type.body, { color: theme.text, flex: 1 }]}>{t.messages.compose.whoCanSee}</Text>
                <MenuPicker<Audience>
                  options={[
                    { value: 'herkes', label: t.messages.compose.audience.herkes },
                    { value: 'takipciler', label: t.messages.compose.audience.takipciler },
                    { value: 'anonim', label: t.messages.compose.audience.anonim },
                  ]}
                  value={audience}
                  onChange={setAudience}
                  accessibilityLabel={t.messages.compose.whoCanSee}
                />
              </View>
              <Text style={[Type.footnote, styles.groupNote, { color: theme.textSecondary }]}>{t.messages.compose.audienceNote[audience]}</Text>
              <View style={[styles.separator, { backgroundColor: theme.separator }]} />
              <View style={styles.groupRow}>
                <Icon ios="bubble.left.and.bubble.right" md="forum" size={18} color={theme.text} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[Type.body, { color: theme.text }]}>{t.messages.compose.joinChat}</Text>
                  <LiveCount count={venue.here} text={t.live.inChat(venue.here)} />
                </View>
                {/* T-3: anahtarlar iOS'un kendi yeşili. */}
                <Switch value={joinChat} onValueChange={setJoinChat} accessibilityLabel={t.messages.compose.joinChat} />
              </View>
            </GlassCard>
          </PageColumn>
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
          <View style={styles.barInner}>
          <ActionButton
            title={
              !nearby
                ? t.messages.compose.mustBeThere
                : posting
                  ? joinChat
                    ? t.messages.compose.shareAndJoin
                    : t.actions.share
                  : t.messages.compose.checkIn
            }
            systemImage={!nearby ? 'location.slash' : posting ? 'paperplane.fill' : 'mappin.and.ellipse'}
            variant="glassProminent"
            fullWidth
            disabled={!nearby}
            onPress={submit}
          />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  farNote: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 14 },
  scroll: { paddingBottom: 140 },
  content: { maxWidth: 600, padding: 16, gap: 16 },
  barInner: { width: '100%', maxWidth: 600, gap: 8, alignItems: 'center' },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: { width: '100%', aspectRatio: 4 / 5, borderRadius: 22 },
  remove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: { height: 150, borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  field: { borderRadius: 22, padding: 14, gap: 6 },
  input: { minHeight: 80, textAlignVertical: 'top' },
  group: { borderRadius: 22, paddingHorizontal: 14, paddingVertical: 6 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  groupNote: { marginLeft: 30, marginBottom: 8 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 30 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 8, gap: 8, alignItems: 'center' },
});
