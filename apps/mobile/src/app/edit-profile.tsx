import * as Device from 'expo-device';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState, type ReactNode } from 'react';
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
import { dropPhoto, keepPhoto } from '@/lib/profile';
import { BIO_MAX, cleanUsername, NAME_MAX, usernameProblem } from '@/lib/profile-rules';

type Choice = { label: string; destructive?: boolean; onPress: () => void };

/** Yerel seçenek listesi (iOS'ta alttan açılan eylem sayfası). */
function choose(title: string, choices: Choice[]) {
  if (Platform.OS === 'ios') {
    const destructive = choices.findIndex((c) => c.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...choices.map((c) => c.label), 'Vazgeç'],
        cancelButtonIndex: choices.length,
        destructiveButtonIndex: destructive >= 0 ? destructive : undefined,
      },
      (index) => choices[index]?.onPress(),
    );
  } else {
    Alert.alert(title, undefined, [
      ...choices.map((c) => ({ text: c.label, style: c.destructive ? ('destructive' as const) : ('default' as const), onPress: c.onPress })),
      { text: 'Vazgeç', style: 'cancel' as const },
    ]);
  }
}

/**
 * Profili düzenle (TASARIM.md §5.8, T-28): profildeki kalemden ve Ayarlar › Hesap'tan açılır. Üstte profildeki
 * gibi kapak ve üstüne binen profil fotoğrafı; dokununca fotoğraf seçilir. Altında ad, kullanıcı adı,
 * hakkında ve ilgi alanları (en fazla 5). Kapak seçilmezse son gecenin fotoğrafı bulanık kullanılır.
 * Kaydedilmemiş değişiklik varsa sayfa aşağı çekilerek kapanmaz; ✕ önce sorar.
 */
export default function EditProfileScreen() {
  const theme = useTheme();
  const { me, updateMe, usernameTaken, posts, venueById, nightsOf } = useApp();
  const [name, setName] = useState(me.displayName);
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio);
  const [interests, setInterests] = useState(me.interests);
  const [avatarUri, setAvatarUri] = useState(me.avatarUri);
  const [coverUri, setCoverUri] = useState(me.coverUri);
  const [saving, setSaving] = useState(false);

  // Kapak seçilmediyse profildeki gibi son gecenin fotoğrafı, bulanık.
  const last = nightsOf('me')[0];
  const autoCover = last ? nightPhoto(last, (id) => posts.find((p) => p.id === id), venueById(last.venueId)) : undefined;

  const usernameError = username === me.username ? undefined : usernameProblem(username, usernameTaken(username));
  const nameError = name.trim() ? undefined : 'Adın boş olamaz.';
  const dirty =
    name !== me.displayName ||
    username !== me.username ||
    bio !== me.bio ||
    interests.join('|') !== me.interests.join('|') ||
    avatarUri !== me.avatarUri ||
    coverUri !== me.coverUri;
  const canSave = dirty && !usernameError && !nameError && !saving;

  /** Fotoğraflardan seç ya da (cihazda) çek. Profil fotoğrafı kare kırpılır; kapak olduğu gibi kalır. */
  const pickPhoto = async (kind: 'avatar' | 'cover', source: 'library' | 'camera') => {
    const avatar = kind === 'avatar';
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Kamera izni gerekli', 'Fotoğraf çekmek için Ayarlar › HERE › Kamera iznini aç.', [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Ayarlar', onPress: () => Linking.openSettings() },
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
    { label: 'Fotoğraflardan seç', onPress: () => pickPhoto(kind, 'library') },
    ...(Device.isDevice ? [{ label: 'Fotoğraf çek', onPress: () => pickPhoto(kind, 'camera') }] : []),
  ];

  const editAvatar = () =>
    choose('Profil fotoğrafı', [
      ...sources('avatar'),
      ...(avatarUri ? [{ label: 'Fotoğrafı kaldır', destructive: true, onPress: () => setAvatarUri(undefined) }] : []),
    ]);

  const editCover = () =>
    choose('Kapak fotoğrafı', [
      ...sources('cover'),
      ...(coverUri ? [{ label: 'Son gecenin fotoğrafını kullan', onPress: () => setCoverUri(undefined) }] : []),
    ]);

  const toggleInterest = (interest: string) =>
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]));

  const save = async () => {
    setSaving(true);
    try {
      const [avatar, cover] = await Promise.all([
        avatarUri ? keepPhoto(avatarUri, 'avatar') : undefined,
        coverUri ? keepPhoto(coverUri, 'cover') : undefined,
      ]);
      if (avatar !== me.avatarUri) dropPhoto(me.avatarUri);
      if (cover !== me.coverUri) dropPhoto(me.coverUri);
      updateMe({ displayName: name.trim(), username, bio: bio.trim(), interests, avatarUri: avatar, coverUri: cover });
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Kaydedilemedi', 'Fotoğraf kaydedilirken bir sorun oldu. Yeniden dene.');
    }
  };

  const close = () => {
    if (!dirty) return router.back();
    Alert.alert('Değişiklikler kaydedilmesin mi?', undefined, [
      { text: 'Düzenlemeye devam et', style: 'cancel' },
      { text: 'Değişiklikleri at', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const cover = coverUri ?? autoCover ?? avatarUri;
  const full = interests.length >= MAX_INTERESTS;

  return (
    <>
      {/* Kaydedilmemiş değişiklik varken sayfa aşağı çekilerek kapanmaz. */}
      <Stack.Screen options={{ gestureEnabled: !dirty }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" accessibilityLabel="Vazgeç" onPress={close} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="checkmark"
          variant="prominent"
          tintColor={theme.accent}
          disabled={!canSave}
          accessibilityLabel="Kaydet"
          onPress={save}
        />
      </Stack.Toolbar>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}>
        <PageColumn style={styles.content}>
          {/* Profildeki gibi: kapak ve üstüne binen profil fotoğrafı. */}
          <View style={styles.photos}>
            <Pressable
              onPress={editCover}
              accessibilityRole="button"
              accessibilityLabel="Kapak fotoğrafını değiştir"
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
              accessibilityLabel="Profil fotoğrafını değiştir"
              style={({ pressed }) => [styles.avatarWrap, { opacity: pressed ? 0.85 : 1 }]}>
              <View style={[styles.avatarFrame, { backgroundColor: theme.background }]}>
                <Avatar name={name.trim() || me.displayName} color={me.avatarColor} uri={avatarUri} size={84} />
              </View>
              <View style={[styles.avatarBadge, { backgroundColor: theme.text, borderColor: theme.background }]}>
                <Icon ios="camera.fill" md="photo_camera" size={13} color={theme.background} />
              </View>
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <GlassCard style={styles.card}>
              <Field label="Ad">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  maxLength={NAME_MAX}
                  placeholder="Adın"
                  placeholderTextColor={theme.textSecondary}
                  autoComplete="name"
                  textContentType="name"
                  accessibilityLabel="Ad"
                  style={[Type.body, styles.input, { color: theme.text }]}
                />
              </Field>
              <View style={[styles.divider, { backgroundColor: theme.separator }]} />
              <Field label="Kullanıcı adı">
                <View style={styles.usernameRow}>
                  <Text style={[Type.body, { color: theme.textSecondary }]}>@</Text>
                  <TextInput
                    value={username}
                    onChangeText={(text) => setUsername(cleanUsername(text))}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="off"
                    accessibilityLabel="Kullanıcı adı"
                    style={[Type.body, styles.input, { color: theme.text }]}
                  />
                </View>
              </Field>
              <View style={[styles.divider, { backgroundColor: theme.separator }]} />
              <Field label="Hakkında" top>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  maxLength={BIO_MAX}
                  multiline
                  placeholder="Kendinden kısaca bahset"
                  placeholderTextColor={theme.textSecondary}
                  accessibilityLabel="Hakkında"
                  style={[Type.body, styles.input, styles.bio, { color: theme.text }]}
                />
                <Text style={[Type.caption, styles.counter, { color: theme.textSecondary }]}>
                  {bio.length}/{BIO_MAX}
                </Text>
              </Field>
            </GlassCard>
            {(nameError || usernameError) && (
              <View style={styles.errorRow} accessibilityLiveRegion="polite">
                <Icon ios="exclamationmark.circle.fill" md="error" size={14} color={theme.accentInk} />
                <Text style={[Type.footnote, { color: theme.accentInk, flex: 1 }]}>{nameError ?? usernameError}</Text>
              </View>
            )}
          </View>

          <View style={{ gap: 12 }}>
            <View style={styles.sectionHead}>
              <Text style={[Type.headline, { color: theme.text, flex: 1 }]} accessibilityRole="header">
                İlgi alanları
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
                    accessibilityLabel={interest}
                    style={({ pressed }) => [
                      styles.chip,
                      { backgroundColor: selected ? theme.text : theme.fill, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
                    ]}>
                    {selected && <Icon ios="checkmark" md="check" size={12} color={theme.inverseText} />}
                    <Text style={[Type.footnote, { color: selected ? theme.inverseText : theme.text, fontWeight: '600' }]}>
                      {interest}
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
function Field({ label, top, children }: { label: string; top?: boolean; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.field, top && { alignItems: 'flex-start' }]}>
      <Text style={[Type.subheadline, styles.label, top && styles.labelTop, { color: theme.textSecondary }]}>{label}</Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const COVER_H = 132;
const AVATAR = 84;

const styles = StyleSheet.create({
  scroll: { paddingBottom: 48 },
  content: { paddingHorizontal: Gap.page, paddingTop: 8, gap: 24 },
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
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: 24, paddingHorizontal: 16 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  label: { width: 104 },
  labelTop: { paddingTop: 14 },
  input: { paddingVertical: 14, flex: 1 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  bio: { minHeight: 92, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 10, fontVariant: ['tabular-nums'] },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 116 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
});
