import * as Device from 'expo-device';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { ActionSheetIOS, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Glass, GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Avatar } from '@/components/kit';
import { PageColumn } from '@/components/page-column';
import { nightPhoto } from '@/components/profile-sections';
import { Text, TextInput } from '@/components/text';
import { Gap, Type } from '@/constants/theme';
import { INTERESTS, MAX_INTERESTS } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n';
import { useT } from '@/i18n/use-t';
import { dropPhoto, keepPhoto } from '@/lib/profile';
import { BIO_MAX, cleanUsername, NAME_MAX, usernameProblem } from '@/lib/profile-rules';

type Choice = { label: string; destructive?: boolean; onPress: () => void };

/** Yerel seçenek listesi (iOS'ta alttan açılan eylem sayfası). */
function choose(title: string, choices: Choice[]) {
  const cancel = strings().actions.cancel;
  if (Platform.OS === 'ios') {
    const destructive = choices.findIndex((c) => c.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...choices.map((c) => c.label), cancel],
        cancelButtonIndex: choices.length,
        destructiveButtonIndex: destructive >= 0 ? destructive : undefined,
      },
      (index) => choices[index]?.onPress(),
    );
  } else {
    Alert.alert(title, undefined, [
      ...choices.map((c) => ({ text: c.label, style: c.destructive ? ('destructive' as const) : ('default' as const), onPress: c.onPress })),
      { text: cancel, style: 'cancel' as const },
    ]);
  }
}

/**
 * Profili düzenle (TASARIM.md §5.8, T-28): profildeki kalemden ve Ayarlar › Hesap'tan açılır. Üstte profildeki
 * gibi kapak ve üstüne binen profil fotoğrafı; dokununca fotoğraf seçilir. Altında ad, kullanıcı adı,
 * hakkında ve ilgi alanları (en fazla 5). Kapak seçilmezse son gecenin fotoğrafı bulanık kullanılır.
 * Alttan açılan sayfa; içeriği kendi içinde kaymaz, klavye açılınca da hiçbir şey yerinden oynamaz. Hakkında kutusu
 * en uzun yazıya (150 karakter) göre baştan büyük; çiplerde hep bir işaret (+ / ✓) olduğu için seçince genişlik değişmez.
 * Kaydedilmemiş değişiklik varsa sayfa aşağı çekilerek kapanmaz; ✕ önce sorar. ✓ değişiklik yokken de profile döner.
 */
export default function EditProfileScreen() {
  const theme = useTheme();
  const t = useT();
  const edit = t.profile.edit;
  const { me, updateMe, usernameTaken, posts, venueById, nightsOf } = useApp();
  const [name, setName] = useState(me.displayName);
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio);
  const [interests, setInterests] = useState(me.interests);
  const [avatarUri, setAvatarUri] = useState(me.avatarUri);
  const [coverUri, setCoverUri] = useState(me.coverUri);
  const [saving, setSaving] = useState(false);
  // Sayfa kapanırken ✓ / ✕'e ikinci kez basılırsa alttaki ekran (ör. Ayarlar) da kapanmasın.
  const leaving = useRef(false);
  const leave = () => {
    if (leaving.current) return;
    leaving.current = true;
    router.back();
  };

  // Kapak seçilmediyse profildeki gibi son gecenin fotoğrafı, bulanık.
  const last = nightsOf('me')[0];
  const autoCover = last ? nightPhoto(last, (id) => posts.find((p) => p.id === id), venueById(last.venueId)) : undefined;

  const problem = username === me.username ? undefined : usernameProblem(username, usernameTaken(username));
  const usernameError = problem && edit.usernameProblem[problem];
  const nameError = name.trim() ? undefined : edit.nameEmpty;
  const dirty =
    name !== me.displayName ||
    username !== me.username ||
    bio !== me.bio ||
    interests.join('|') !== me.interests.join('|') ||
    avatarUri !== me.avatarUri ||
    coverUri !== me.coverUri;
  // ✓ değişiklik yokken de basılır ve profile döner; yalnızca hata varken ya da kaydederken kapalı.
  const canSave = !usernameError && !nameError && !saving;

  /** Fotoğraflardan seç ya da (cihazda) çek. Profil fotoğrafı kare kırpılır; kapak olduğu gibi kalır. */
  const pickPhoto = async (kind: 'avatar' | 'cover', source: 'library' | 'camera') => {
    const avatar = kind === 'avatar';
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(edit.cameraDenied.title, edit.cameraDenied.message, [
          { text: t.actions.cancel, style: 'cancel' },
          { text: edit.cameraDenied.settings, onPress: () => Linking.openSettings() },
        ]);
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: avatar, aspect: [1, 1] };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            ...options,
            cameraType: avatar ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
          })
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    if (avatar) setAvatarUri(result.assets[0].uri);
    else setCoverUri(result.assets[0].uri);
  };

  // Simülatörde kamera yok; "Fotoğraf çek" yalnızca cihazda.
  const sources = (kind: 'avatar' | 'cover'): Choice[] => [
    { label: edit.fromLibrary, onPress: () => pickPhoto(kind, 'library') },
    ...(Device.isDevice ? [{ label: edit.takePhoto, onPress: () => pickPhoto(kind, 'camera') }] : []),
  ];

  const editAvatar = () =>
    choose(edit.avatarTitle, [
      ...sources('avatar'),
      ...(avatarUri ? [{ label: edit.removePhoto, destructive: true, onPress: () => setAvatarUri(undefined) }] : []),
    ]);

  const editCover = () =>
    choose(edit.coverTitle, [
      ...sources('cover'),
      ...(coverUri ? [{ label: edit.useLastNight, onPress: () => setCoverUri(undefined) }] : []),
    ]);

  const toggleInterest = (interest: string) =>
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]));

  const save = async () => {
    if (!dirty) return leave();
    setSaving(true);
    try {
      const [avatar, cover] = await Promise.all([
        avatarUri ? keepPhoto(avatarUri, 'avatar') : undefined,
        coverUri ? keepPhoto(coverUri, 'cover') : undefined,
      ]);
      if (avatar !== me.avatarUri) dropPhoto(me.avatarUri);
      if (cover !== me.coverUri) dropPhoto(me.coverUri);
      updateMe({ displayName: name.trim(), username, bio: bio.trim(), interests, avatarUri: avatar, coverUri: cover });
      leave();
    } catch {
      setSaving(false);
      Alert.alert(edit.saveFailed.title, edit.saveFailed.message);
    }
  };

  const close = () => {
    if (!dirty) return leave();
    Alert.alert(edit.discard.title, undefined, [
      { text: edit.discard.keepEditing, style: 'cancel' },
      { text: edit.discard.discard, style: 'destructive', onPress: leave },
    ]);
  };

  const cover = coverUri ?? autoCover ?? avatarUri;
  const full = interests.length >= MAX_INTERESTS;

  return (
    <>
      {/* Kaydedilmemiş değişiklik varken sayfa aşağı çekilerek kapanmaz. */}
      <Stack.Screen options={{ gestureEnabled: !dirty }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" accessibilityLabel={t.actions.cancel} onPress={close} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="checkmark"
          variant="prominent"
          tintColor={theme.accent}
          disabled={!canSave}
          accessibilityLabel={edit.save}
          onPress={save}
        />
      </Stack.Toolbar>

      {/* Sığdığı sürece kaymaz ve esnemez; yalnızca küçük ekranlarda (sığmazsa) kayar. Boşluğa dokununca klavye kapanır. */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        alwaysBounceVertical={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}>
        <PageColumn style={styles.content}>
          {/* Profildeki gibi: kapak ve üstüne binen profil fotoğrafı. */}
          <View style={styles.photos}>
            <Pressable
              onPress={editCover}
              accessibilityRole="button"
              accessibilityLabel={edit.changeCover}
              style={({ pressed }) => [styles.cover, { backgroundColor: theme.accentSoft, opacity: pressed ? 0.85 : 1 }]}>
              {cover && (
                <Image
                  source={{ uri: cover }}
                  style={coverUri ? StyleSheet.absoluteFill : styles.blurred}
                  contentFit="cover"
                  blurRadius={coverUri ? 0 : 22}
                  transition={200}
                />
              )}
              <View style={[StyleSheet.absoluteFill, styles.shade]} />
              <Glass style={styles.coverButton} interactive>
                <Icon ios="camera.fill" md="photo_camera" size={18} color="#fff" />
              </Glass>
            </Pressable>

            <Pressable
              onPress={editAvatar}
              accessibilityRole="button"
              accessibilityLabel={edit.changeAvatar}
              style={({ pressed }) => [styles.avatarWrap, { opacity: pressed ? 0.85 : 1 }]}>
              <View style={[styles.avatarFrame, { backgroundColor: theme.background }]}>
                <Avatar name={name.trim() || me.displayName} color={me.avatarColor} uri={avatarUri} size={AVATAR} />
              </View>
              <View style={[styles.avatarBadge, { backgroundColor: theme.text, borderColor: theme.background }]}>
                <Icon ios="camera.fill" md="photo_camera" size={12} color={theme.background} />
              </View>
            </Pressable>
          </View>

          <View style={{ gap: 6 }}>
            <GlassCard style={styles.card}>
              <Field label={edit.name}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  maxLength={NAME_MAX}
                  placeholder={edit.namePlaceholder}
                  placeholderTextColor={theme.textSecondary}
                  autoComplete="name"
                  textContentType="name"
                  accessibilityLabel={edit.name}
                  style={[Type.body, styles.input, { color: theme.text }]}
                />
              </Field>
              <View style={[styles.divider, { backgroundColor: theme.separator }]} />
              <Field label={edit.username}>
                <View style={styles.usernameRow}>
                  <Text style={[Type.body, { color: theme.textSecondary }]}>@</Text>
                  <TextInput
                    value={username}
                    onChangeText={(text) => setUsername(cleanUsername(text))}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="off"
                    accessibilityLabel={edit.username}
                    style={[Type.body, styles.input, { color: theme.text }]}
                  />
                </View>
              </Field>
              <View style={[styles.divider, { backgroundColor: theme.separator }]} />
              {/* Tam genişlik ve en uzun yazıya göre sabit yükseklik: yazdıkça büyümez. Satır atlanmaz (Bitti klavyeyi kapatır). */}
              <View style={styles.bioHead}>
                <Text style={[Type.subheadline, { color: theme.textSecondary, flex: 1 }]}>{edit.bio}</Text>
                <Text style={[Type.caption, { color: theme.textSecondary, fontVariant: ['tabular-nums'] }]}>
                  {bio.length}/{BIO_MAX}
                </Text>
              </View>
              <TextInput
                value={bio}
                onChangeText={(text) => setBio(text.replace(/\n/g, ' '))}
                maxLength={BIO_MAX}
                multiline
                submitBehavior="blurAndSubmit"
                returnKeyType="done"
                placeholder={edit.bioPlaceholder}
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel={edit.bio}
                style={[Type.body, styles.bio, { color: theme.text }]}
              />
            </GlassCard>
            {/* Uyarı satırının yeri hep ayrılı: uyarı çıkınca altındakiler kaymaz. */}
            <View style={styles.errorRow} accessibilityLiveRegion="polite">
              {(nameError || usernameError) && (
                <>
                  <Icon ios="exclamationmark.circle.fill" md="error" size={14} color={theme.accentInk} />
                  <Text style={[Type.footnote, { color: theme.accentInk, flex: 1 }]} numberOfLines={1}>
                    {nameError ?? usernameError}
                  </Text>
                </>
              )}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <View style={styles.sectionHead}>
              <Text style={[Type.headline, { color: theme.text, flex: 1 }]} accessibilityRole="header">
                {edit.interests}
              </Text>
              <Text style={[Type.footnote, { color: theme.textSecondary, fontVariant: ['tabular-nums'] }]}>
                {interests.length}/{MAX_INTERESTS}
              </Text>
            </View>
            <View style={styles.chips}>
              {INTERESTS.map((interest) => {
                const selected = interests.includes(interest);
                const disabled = full && !selected;
                return (
                  <Pressable
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    disabled={disabled}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected, disabled }}
                    accessibilityLabel={t.interest(interest)}
                    style={({ pressed }) => [
                      styles.chip,
                      { backgroundColor: selected ? theme.text : theme.fill, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
                    ]}>
                    {/* Seçili olmayanda da işaret var: seçince çipin genişliği, dolayısıyla dizilişi değişmez. */}
                    <Icon
                      ios={selected ? 'checkmark' : 'plus'}
                      md={selected ? 'check' : 'add'}
                      size={12}
                      color={selected ? theme.inverseText : theme.textSecondary}
                    />
                    <Text style={[Type.footnote, { color: selected ? theme.inverseText : theme.text, fontWeight: '600' }]}>
                      {t.interest(interest)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </PageColumn>
      </ScrollView>
    </>
  );
}

/** Kartta bir satır: solda etiket, sağda alan (X'teki gibi). */
function Field({ label, children }: { label: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[Type.subheadline, styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const COVER_H = 104;
const AVATAR = 76;
/** Hakkında kutusu: 150 karakter tam genişlikte 4 satıra sığıyor (DM Sans 17); bir satır pay. */
const BIO_LINES = 5;

const styles = StyleSheet.create({
  scroll: { paddingBottom: 8 },
  content: { paddingHorizontal: Gap.page, paddingTop: 4, gap: 12 },
  photos: { paddingBottom: AVATAR / 2 - 4 },
  cover: { height: COVER_H, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  blurred: { position: 'absolute', top: -30, left: -30, right: -30, bottom: -30 },
  shade: { backgroundColor: 'rgba(0, 0, 0, 0.22)' },
  coverButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { position: 'absolute', left: 14, bottom: 0 },
  avatarFrame: { padding: 3, borderRadius: AVATAR },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: 24, paddingHorizontal: 16 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50 },
  label: { width: 104 },
  input: { paddingVertical: 13, flex: 1 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  bioHead: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  // Type.body satır yüksekliği 22.
  bio: { height: BIO_LINES * 22 + 14, paddingTop: 2, paddingBottom: 12, textAlignVertical: 'top' },
  divider: { height: StyleSheet.hairlineWidth },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 16, paddingHorizontal: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
});
