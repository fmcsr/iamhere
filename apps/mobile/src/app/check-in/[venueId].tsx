import * as Device from 'expo-device';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, ZoomIn, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Avatar, formatDistance } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PinSlider } from '@/components/pin-slider';
import { Text, TextInput } from '@/components/text';
import { Type } from '@/constants/theme';
import type { User, Venue } from '@/data/mock';
import { useApp } from '@/data/store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';
import { joinNames } from '@/lib/tr';

/** İğnenin saplanışı görünsün diye sohbete geçmeden önce beklenen süre (ms). */
const PIN_SETTLE_MS = 700;
const PHOTO = 112;
/** Fotoğrafın altındaki yazı (S3). */
const CAPTION_MAX = 150;

/**
 * Yer bildirme sayfası (TASARIM.md T-26): alttan sade biçimde kayar (Luma'nın "Leave Event"i gibi). İki adım
 * (28.10.2026; kamera, yazı ve iğne bir aradayken kalabalık görünüyordu):
 *   1. Oluştur: mekân ve kamera dairesi; istersen o an fotoğraf çekersin (galeri yok), altına kısa yazı ve
 *      "Kimlerle?" etiketi (S3). "Tamam" (fotoğraf yoksa "Fotoğrafsız devam").
 *   2. Önizleme: paylaşım akışta nasıl görünecekse öyle; yanında fuşya oluk. İğneyi aşağı kaydırınca zemine
 *      saplanır, yer bildirilir ve doğrudan mekân sohbetine geçilir.
 * Yalnızca 300 m içinde açılır (K-17); uzaktaki mekânda düğme "Yol tarifi" olduğu için kilitli sayfa yok (S5).
 * Sayfa Liquid Glass: ardındaki mekân sayfası görünür. Üstteki boş alana dokununca kapanır.
 */
export default function CheckInSheet() {
  const theme = useTheme();
  const t = useT();
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { venueId, from } = useLocalSearchParams<{ venueId: string; from?: 'chat' }>();
  const { venueById, canCheckIn, doCheckIn, taggableAt } = useApp();
  const venue = venueById(venueId);
  const [step, setStep] = useState<'compose' | 'preview'>('compose');
  const [photo, setPhoto] = useState<string>();
  const [shots, setShots] = useState(0);
  const [caption, setCaption] = useState('');
  const [tagged, setTagged] = useState<string[]>([]);
  const shown = useSharedValue(0);
  const near = venue ? canCheckIn(venue.id) : false;

  // Uzaktaki mekânda bu sayfa açılmaz (S5); eski bir bağlantıyla gelinirse geri dönülür.
  useEffect(() => {
    if (!near) router.back();
  }, [near]);

  // Alttan düz bir kayış: yaylanma ya da sallanma yok.
  useEffect(() => {
    shown.set(withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
  }, [shown]);

  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(shown.get(), [0, 1], [460, 0]) }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: shown.get() }));

  /** Sayfayı aşağı indirip kapatır; isteğe bağlı olarak ardından bir sayfa açar. */
  const close = (next?: () => void) => {
    shown.set(withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }));
    setTimeout(() => {
      router.back();
      next?.();
    }, 230);
  };

  if (!venue || !near) return null;
  const friends = taggableAt(venue.id);
  const toggleTag = (userId: string) => setTagged((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));

  /** Yalnızca kamera: o an çekilen fotoğraf. Simülatörde kamera yok; mekânın o geceki fotoğrafı çekilmiş sayılır. */
  const takePhoto = async () => {
    if (!Device.isDevice) {
      const photos = venue.nightPhotos.length ? venue.nightPhotos : [venue.coverUri];
      setPhoto(photos[shots % photos.length]);
      setShots((n) => n + 1);
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.home.sheet.cameraTitle, t.home.sheet.cameraMessage, [
        { text: t.actions.cancel, style: 'cancel' },
        { text: t.home.sheet.openSettings, onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, cameraType: ImagePicker.CameraType.back });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  // İğne saplanınca yer bildirilir; saplanış görünür görünmez doğrudan sohbete geçilir.
  const onPinned = () => {
    doCheckIn({ venueId: venue.id, text: caption, imageUri: photo, tagged });
    setTimeout(
      () => close(from === 'chat' ? undefined : () => router.push({ pathname: '/chat/[id]', params: { id: `c-${venue.id}` } })),
      PIN_SETTLE_MS,
    );
  };

  const venueRow = (
    <View style={styles.venueRow}>
      <Image source={{ uri: venue.coverUri }} style={styles.thumb} contentFit="cover" />
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[Type.headline, { color: theme.text }]} numberOfLines={2}>
          {venue.name}
        </Text>
        <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
          {t.categories[venue.category]} · {formatDistance(venue.distanceM, t)}
        </Text>
      </View>
    </View>
  );

  const compose = (
    <Animated.View key="compose" entering={FadeIn.duration(180)} style={styles.step}>
      {venueRow}

      <View style={styles.cameraArea}>
        <View>
          <Pressable
            onPress={takePhoto}
            accessibilityRole="button"
            accessibilityLabel={photo ? t.home.sheet.retakePhoto : t.home.sheet.takePhoto}
            style={({ pressed }) => [
              styles.photo,
              { backgroundColor: theme.fill, borderColor: photo ? theme.accent : theme.separator, opacity: pressed ? 0.75 : 1 },
            ]}>
            {photo ? (
              <Animated.View key={photo} entering={ZoomIn.duration(260)} style={StyleSheet.absoluteFill}>
                <Image source={{ uri: photo }} style={styles.photoImage} contentFit="cover" />
              </Animated.View>
            ) : (
              <Icon ios="camera.fill" md="photo_camera" size={34} color={theme.text} />
            )}
          </Pressable>
          {photo && (
            <Animated.View entering={FadeIn} style={styles.removeWrap}>
              <Pressable
                onPress={() => setPhoto(undefined)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t.home.sheet.removePhoto}
                style={[styles.remove, { backgroundColor: theme.text, borderColor: theme.background }]}>
                <Icon ios="xmark" md="close" size={11} color={theme.background} />
              </Pressable>
            </Animated.View>
          )}
        </View>
        {!photo && <Text style={[Type.footnote, { color: theme.textSecondary }]}>{t.home.sheet.photoOptional}</Text>}
      </View>

      {/* Fotoğraf çekilince: altına kısa yazı ve "Kimlerle?" (S3). Yalnızca yazıdan oluşan paylaşım yok. */}
      {photo && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.details}>
          <View style={[styles.captionBox, { backgroundColor: theme.fill }]}>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder={t.home.sheet.caption}
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel={t.home.sheet.captionA11y}
              maxLength={CAPTION_MAX}
              multiline
              style={[Type.body, styles.captionInput, { color: theme.text }]}
            />
            <Text style={[Type.caption, styles.counter, { color: theme.textSecondary }]}>
              {caption.length}/{CAPTION_MAX}
            </Text>
          </View>
          <Text style={[Type.footnote, { color: theme.textSecondary, fontWeight: '600' }]}>{t.home.sheet.withWhom}</Text>
          {friends.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.tags}>
              {friends.map((u) => {
                const on = tagged.includes(u.id);
                return (
                  <Pressable
                    key={u.id}
                    onPress={() => toggleTag(u.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t.home.sheet.tag(`@${u.username}`)}
                    style={[styles.tag, { backgroundColor: on ? theme.accent : theme.fill }]}>
                    <Avatar name={u.displayName} color={u.avatarColor} uri={u.avatarUri} size={24} />
                    <Text style={[Type.footnote, { color: on ? theme.onAccent : theme.text, fontWeight: '600' }]}>
                      {u.displayName.split(' ')[0]}
                    </Text>
                    {on && <Icon ios="checkmark" md="check" size={12} color={theme.onAccent} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={[Type.footnote, { color: theme.textSecondary }]}>{t.home.sheet.withWhomEmpty}</Text>
          )}
        </Animated.View>
      )}

      {/* Cam sayfanın içinde cam düğme yok (§2.3 kural 1): dolu düğme. */}
      <ActionButton title={photo ? t.home.sheet.done : t.home.sheet.skipPhoto} variant="filled" fullWidth onPress={() => setStep('preview')} />
    </Animated.View>
  );

  const preview = (
    <Animated.View key="preview" entering={FadeIn.duration(180)} style={styles.step}>
      <View style={styles.previewHeader}>
        <Pressable
          onPress={() => setStep('compose')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t.home.sheet.edit}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}>
          <Icon ios="chevron.left" md="arrow_back" size={15} color={theme.text} />
          <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]}>{t.home.sheet.edit}</Text>
        </Pressable>
        <Text style={[Type.headline, { color: theme.text }]}>{t.home.sheet.preview}</Text>
      </View>
      <View style={styles.row}>
        <PostPreview venue={venue} photo={photo} caption={caption.trim()} tagged={friends.filter((u) => tagged.includes(u.id))} />
        <PinSlider locked={false} onPinned={onPinned} />
      </View>
    </Animated.View>
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityRole="button" accessibilityLabel={t.actions.close} />
      </Animated.View>

      {/* Yazı yazarken klavye sayfayı yukarı iter. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoid} pointerEvents="box-none">
        <Animated.View style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom - 18, 10) }, sheet]}>
          {/* Liquid Glass: ardındaki sayfa görünür (mekân sayfasının düğmeleri bu sırada gizli). */}
          <Glass variant="regular" tint={dark ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.18)'} style={styles.sheet}>
            <View style={[styles.grabber, { backgroundColor: theme.separator }]} />
            {step === 'compose' ? compose : preview}
          </Glass>
        </Animated.View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

/** Önizleme: paylaşım akışta nasıl görünecekse (fotoğraf, yazı, "… ile", mekân); fotoğraf yoksa yalnızca yer bildirimi. */
function PostPreview({ venue, photo, caption, tagged }: { venue: Venue; photo?: string; caption: string; tagged: User[] }) {
  const theme = useTheme();
  const t = useT();
  if (!photo) {
    return (
      <View style={[styles.preview, styles.onlyCheckIn, { backgroundColor: theme.fill }]}>
        <Image source={{ uri: venue.coverUri }} style={styles.previewVenuePhoto} contentFit="cover" />
        <Text style={[Type.headline, { color: theme.text }]} numberOfLines={2}>
          {venue.name}
        </Text>
        <Text style={[Type.footnote, { color: theme.textSecondary }]}>{t.home.sheet.onlyCheckIn}</Text>
      </View>
    );
  }
  const names = tagged.map((u) => u.displayName.split(' ')[0]);
  return (
    <View style={styles.preview}>
      <Image source={{ uri: photo }} style={styles.previewPhoto} contentFit="cover" />
      {caption ? (
        <Text style={[Type.subheadline, { color: theme.text }]} numberOfLines={4}>
          {caption}
        </Text>
      ) : null}
      <View style={styles.previewMeta}>
        <Icon ios="mappin.and.ellipse" md="location_on" size={12} color={theme.textSecondary} />
        <Text style={[Type.footnote, { color: theme.textSecondary, flex: 1 }]} numberOfLines={1}>
          {venue.name}
        </Text>
      </View>
      {names.length > 0 && (
        <View style={styles.previewMeta}>
          <Icon ios="person.2.fill" md="group" size={12} color={theme.textSecondary} />
          <Text style={[Type.footnote, { color: theme.textSecondary, flex: 1 }]} numberOfLines={1}>
            {t.card.withNames(joinNames(names, t))}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  avoid: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.16)' },
  sheetWrap: { paddingHorizontal: 10 },
  sheet: { borderRadius: 36, padding: 20, paddingTop: 10, gap: 14, overflow: 'hidden' },
  grabber: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3 },
  step: { gap: 14 },
  row: { flexDirection: 'row', gap: 16, alignItems: 'flex-end' },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  cameraArea: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 },
  photo: { width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2, borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  // Kaldır düğmesi dairenin sağ üst kenarında.
  removeWrap: { position: 'absolute', top: 2, right: 2 },
  remove: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  details: { gap: 8 },
  captionBox: { borderRadius: 18, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 },
  captionInput: { minHeight: 40, maxHeight: 96, paddingTop: 8 },
  counter: { alignSelf: 'flex-end', fontVariant: ['tabular-nums'] },
  tags: { gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingRight: 10, height: 32, borderRadius: 16 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 28 },
  back: { position: 'absolute', left: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
  preview: { flex: 1, gap: 8 },
  previewPhoto: { width: '100%', aspectRatio: 4 / 5, borderRadius: 18 },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlyCheckIn: { borderRadius: 22, padding: 14, gap: 6 },
  previewVenuePhoto: { width: '100%', aspectRatio: 16 / 10, borderRadius: 14, marginBottom: 4 },
});
