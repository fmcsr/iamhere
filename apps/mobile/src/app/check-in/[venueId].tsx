import * as Device from 'expo-device';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, ZoomIn, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { formatDistance } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PinSlider } from '@/components/pin-slider';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { CATEGORY_LABEL, CHECK_IN_RADIUS_M } from '@/data/mock';
import { useApp } from '@/data/store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

/** İğnenin saplanışı görünsün diye sohbete geçmeden önce beklenen süre (ms). */
const PIN_SETTLE_MS = 700;
const PHOTO = 112;

/**
 * Yer bildirme sayfası (TASARIM.md T-26): alttan sade biçimde kayar (Luma'nın "Leave Event"i gibi).
 * Solda yalnızca mekân ve kamera dairesi: istersen o an fotoğraf çekersin (galeri yok), çektiğin
 * fotoğraf dairenin içine oturur. Sağda fuşya oluk: iğneyi aşağı kaydırınca zemine saplanır, yer
 * bildirilir (fotoğraf varsa paylaşımıyla) ve doğrudan mekân sohbetine geçilir. 300 m'den uzaksa
 * oluk kilitli (K-17). Arka plana dokununca ya da "Vazgeç"le kapanır.
 */
export default function CheckInSheet() {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { venueId, from } = useLocalSearchParams<{ venueId: string; from?: 'chat' }>();
  const { venueById, canCheckIn, doCheckIn, settings } = useApp();
  const venue = venueById(venueId);
  const [photo, setPhoto] = useState<string>();
  const [shots, setShots] = useState(0);
  const shown = useSharedValue(0);

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

  if (!venue) return null;
  const near = canCheckIn(venue.id);

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
      Alert.alert('Kamera izni gerekli', 'Fotoğraf çekmek için Ayarlar › HERE › Kamera iznini aç.', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ayarlar', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, cameraType: ImagePicker.CameraType.back });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  // İğne saplanınca yer bildirilir; saplanış görünür görünmez doğrudan sohbete geçilir.
  const onPinned = () => {
    doCheckIn({ venueId: venue.id, text: '', imageUri: photo, audience: settings.lastAudience });
    setTimeout(
      () => close(from === 'chat' ? undefined : () => router.push({ pathname: '/chat/[id]', params: { id: `c-${venue.id}` } })),
      PIN_SETTLE_MS,
    );
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityRole="button" accessibilityLabel="Kapat" />
      </Animated.View>

      <Animated.View style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom - 18, 10) }, sheet]}>
        {/* Cam, alttaki fuşya düğmeyi göstermesin diye zemin rengiyle tonlu. */}
        <Glass variant="regular" tint={dark ? 'rgba(24, 22, 28, 0.82)' : 'rgba(255, 255, 255, 0.82)'} style={styles.sheet}>
          <View style={[styles.grabber, { backgroundColor: theme.separator }]} />
          <View style={styles.row}>
            <View style={styles.info}>
              <View style={styles.venueRow}>
                <Image source={{ uri: venue.coverUri }} style={styles.thumb} contentFit="cover" />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={[Type.headline, { color: theme.text }]} numberOfLines={2}>
                    {venue.name}
                  </Text>
                  <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
                    {CATEGORY_LABEL[venue.category]} · {formatDistance(venue.distanceM)}
                  </Text>
                </View>
              </View>

              {near ? (
                <View style={styles.cameraArea}>
                  <View>
                    <Pressable
                      onPress={takePhoto}
                      accessibilityRole="button"
                      accessibilityLabel={photo ? 'Fotoğrafı yeniden çek' : 'Fotoğraf çek (isteğe bağlı)'}
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
                          accessibilityLabel="Fotoğrafı kaldır"
                          style={[styles.remove, { backgroundColor: theme.text, borderColor: theme.background }]}>
                          <Icon ios="xmark" md="close" size={11} color={theme.background} />
                        </Pressable>
                      </Animated.View>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.farArea}>
                  <Text style={[Type.subheadline, { color: theme.textSecondary }]}>
                    {CHECK_IN_RADIUS_M} m içinde değilsin · {formatDistance(venue.distanceM)} uzaktasın
                  </Text>
                  <ActionButton
                    title="Yol tarifi"
                    systemImage="arrow.triangle.turn.up.right.diamond.fill"
                    variant="glass"
                    size="regular"
                    onPress={() => Linking.openURL(`https://maps.apple.com/?daddr=${venue.latitude},${venue.longitude}`)}
                  />
                </View>
              )}

              <Pressable onPress={() => close()} hitSlop={10} accessibilityRole="button" style={styles.cancel}>
                <Text style={[Type.subheadline, { color: theme.textSecondary, fontWeight: '600' }]}>Vazgeç</Text>
              </Pressable>
            </View>

            <PinSlider locked={!near} onPinned={onPinned} />
          </View>
        </Glass>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.32)' },
  sheetWrap: { paddingHorizontal: 10 },
  sheet: { borderRadius: 36, padding: 20, paddingTop: 10, gap: 14, overflow: 'hidden' },
  grabber: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3 },
  row: { flexDirection: 'row', gap: 16, alignItems: 'stretch' },
  info: { flex: 1, gap: 10 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  cameraArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photo: { width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2, borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  // Kaldır düğmesi dairenin sağ üst kenarında.
  removeWrap: { position: 'absolute', top: 2, right: 2 },
  remove: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  farArea: { flex: 1, justifyContent: 'center', gap: 12, alignItems: 'flex-start' },
  cancel: { alignSelf: 'flex-start' },
});
