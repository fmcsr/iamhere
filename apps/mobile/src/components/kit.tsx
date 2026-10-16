import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, type ReactNode } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon, type SFSymbolName } from '@/components/icon';
import { ActionButton } from '@/components/native-controls';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { CATEGORY_LABEL, type Category, type Message, type Post, type User, type Venue } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useNight } from '@/lib/night';

type IconPair = { ios: SFSymbolName; md: Parameters<typeof Icon>[0]['md'] };

export const CATEGORY_ICON: Record<Category, IconPair> = {
  konser: { ios: 'music.note', md: 'music_note' },
  bar: { ios: 'wineglass', md: 'local_bar' },
  yemek: { ios: 'fork.knife', md: 'restaurant' },
  kafe: { ios: 'cup.and.saucer', md: 'local_cafe' },
  acik: { ios: 'tree', md: 'park' },
};

export function minutesAgo(ts: number): string {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk`;
  return `${Math.floor(m / 60)} sa`;
}

/** Sohbet listesi ve önizlemeler için tek satırlık mesaj metni (plan kartları dahil). */
export function messagePreview(message: Message): string {
  return message.plan ? `${message.plan.emoji} Plan: ${message.plan.title} · ${message.plan.time}` : message.text;
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function Avatar({
  name,
  color,
  uri,
  size = 40,
  anonymous,
  ring,
}: {
  name: string;
  color: string;
  /** Profil fotoğrafı. Yüklenene kadar (ya da yüklenemezse) renkli zeminde baş harf görünür. */
  uri?: string;
  size?: number;
  anonymous?: boolean;
  /** Fuşya halka: bu kişi şu an bir mekânda. */
  ring?: boolean;
}) {
  const theme = useTheme();
  const face = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: anonymous ? theme.backgroundSelected : color,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      {anonymous ? (
        <Icon ios="moon.fill" md="dark_mode" size={size * 0.45} color={theme.textSecondary} />
      ) : (
        <>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.4 }}>{name.charAt(0)}</Text>
          {uri && <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />}
        </>
      )}
    </View>
  );
  if (!ring) return face;
  return <View style={[styles.ring, { borderColor: theme.accent, borderRadius: size }]}>{face}</View>;
}

/** Üst üste binen küçük avatarlar ("burada kimler var"). */
export function AvatarStack({ users, size = 26 }: { users: User[]; size?: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      {users.map((u, i) => (
        <View
          key={u.id}
          style={{ marginLeft: i === 0 ? 0 : -size * 0.32, borderRadius: size, borderWidth: 2, borderColor: theme.surface }}>
          <Avatar name={u.displayName} color={u.avatarColor} uri={u.avatarUri} size={size} />
        </View>
      ))}
    </View>
  );
}

/**
 * Kum saati + sohbetin sıfırlanmasına (04:00) kalan süre; sohbet başlığında. Son 60 dakikada ikon fuşyaya döner.
 * Metin her zaman nötr kalır; cam üstünde de okunur (TASARIM.md §2.3).
 */
export function Countdown({ size = 13, color }: { size?: number; color?: string }) {
  const theme = useTheme();
  const { remaining, lastHour } = useNight();
  const tint = color ?? theme.text;
  return (
    <View style={styles.countdown} accessible accessibilityLabel={`Sohbetin sıfırlanmasına ${remaining} kaldı`}>
      <Icon ios="hourglass" md="hourglass_top" size={size + 1} color={lastHour ? theme.accent : tint} />
      <Text style={{ color: tint, fontSize: size, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{remaining}</Text>
    </View>
  );
}

/**
 * "● 342 burada": nokta fuşya, metin nötr. Sayı hep bir cam kartın ya da cam kontrolün üstünde
 * durduğu için küçük fuşya metin kullanılmaz (TASARIM.md §2.3 kural 5): koyu modda gri camda
 * kontrast 4.5:1'in altına düşüyor, iOS 27'nin cam renk ayarı da zemini değiştiriyor.
 */
export function LiveCount({ count, suffix = 'kişi' }: { count: number; suffix?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.live} accessible accessibilityLabel={`${count} ${suffix}`}>
      <View style={[styles.dot, { backgroundColor: theme.accent }]} />
      <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>
        {count} {suffix}
      </Text>
    </View>
  );
}

/** Mekân simgesi: yuvarlatılmış kare (kişiler daire, mekânlar kare; ilk bakışta ayrışsın). */
export function VenueIcon({ category, size = 44 }: { category: Category; size?: number }) {
  const theme = useTheme();
  const icon = CATEGORY_ICON[category];
  return (
    <View style={[styles.venueIcon, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: theme.backgroundElement }]}>
      <Icon ios={icon.ios} md={icon.md} size={size * 0.45} color={theme.text} />
    </View>
  );
}

export function VenueRow({
  venue,
  onPress,
  dimmed,
  trailing,
  subtitle,
}: {
  venue: Venue;
  onPress: () => void;
  /** Soluk göster (ör. 300 m dışında) ama gizleme. */
  dimmed?: boolean;
  trailing?: ReactNode;
  subtitle?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.venueRow, { opacity: dimmed ? 0.5 : pressed ? 0.7 : 1 }]}>
      <VenueIcon category={venue.category} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
          {venue.name}
        </Text>
        <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
          {subtitle ?? `${CATEGORY_LABEL[venue.category]} · ${formatDistance(venue.distanceM)}`}
        </Text>
      </View>
      {trailing ?? <LiveCount count={venue.here} />}
    </Pressable>
  );
}

/** Bildir / Engelle / Sessize al: her kişide ve paylaşımda bir dokunuş uzakta (TASARIM.md §1). */
export function showSafetyMenu(title: string) {
  const options = ['Bildir', 'Engelle', 'Sessize al'];
  const note = (index: number) => Alert.alert(options[index], 'Prototipte bu işlem henüz kaydedilmiyor.');
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { title, options: [...options, 'Vazgeç'], cancelButtonIndex: 3, destructiveButtonIndex: [0, 1] },
      (index) => index < 3 && note(index),
    );
  } else {
    Alert.alert(title, undefined, [...options.map((text, i) => ({ text, onPress: () => note(i) })), { text: 'Vazgeç', style: 'cancel' }]);
  }
}

/**
 * Akış kartı (TASARIM.md §5.2): kişi → dokunulabilir mekân satırı → 4:5 fotoğraf (çift dokunuşla
 * beğeni) → metin → eylemler. Kart geçirgen Liquid Glass (T-13, T-17): arkadaki gradyan görünür.
 */
export function PostCard({ post }: { post: Post }) {
  const theme = useTheme();
  const { userById, venueById, liked, toggleLike, checkIn } = useApp();
  const lastTap = useRef(0);
  const user = userById(post.userId);
  const venue = venueById(post.venueId);
  const isLiked = liked.has(post.id);
  const anonymous = Boolean(post.anonAlias);
  const name = anonymous ? post.anonAlias! : user.displayName;
  const iAmHere = checkIn?.venueId === post.venueId;

  const openVenue = () => venue && router.push({ pathname: '/venue/[id]', params: { id: venue.id } });
  const onPhotoPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300 && !isLiked) toggleLike(post.id);
    lastTap.current = now;
  };

  return (
    <GlassCard style={styles.card} translucent>
      <View style={styles.cardHeader}>
        <Pressable
          disabled={anonymous || post.userId === 'me'}
          onPress={() => router.push({ pathname: '/user/[username]', params: { username: user.username } })}
          style={styles.author}>
          <Avatar name={user.displayName} color={user.avatarColor} uri={user.avatarUri} anonymous={anonymous} size={36} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]}>
              {name}
              <Text style={{ color: theme.textSecondary, fontWeight: '400' }}> · {minutesAgo(post.createdAt)}</Text>
            </Text>
            <Text numberOfLines={1} style={[Type.footnote, { color: theme.textSecondary }]}>
              {anonymous ? 'Anonim paylaşım' : `@${user.username}`}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => showSafetyMenu(name)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Diğer seçenekler"
          style={styles.iconButton}>
          <Icon ios="ellipsis" md="more_horiz" size={18} color={theme.textSecondary} />
        </Pressable>
      </View>

      {venue && (
        <Pressable
          onPress={openVenue}
          accessibilityRole="link"
          accessibilityLabel={`${venue.name}, ${venue.here} kişi burada`}
          style={({ pressed }) => [styles.venueLine, { backgroundColor: theme.fill, opacity: pressed ? 0.7 : 1 }]}>
          <Icon ios="mappin.and.ellipse" md="location_on" size={15} color={theme.accentInk} />
          <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600', flex: 1 }]} numberOfLines={1}>
            {venue.name}
          </Text>
          <LiveCount count={venue.here} suffix="burada" />
          <Icon ios="chevron.right" md="chevron_right" size={12} color={theme.textSecondary} />
        </Pressable>
      )}

      {post.imageUri && (
        <Pressable onPress={onPhotoPress} accessibilityHint="Beğenmek için iki kez dokun">
          <Image
            source={{ uri: post.imageUri }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`${venue?.name ?? ''} fotoğrafı`}
          />
        </Pressable>
      )}
      {post.text && <Text style={[Type.body, { color: theme.text }]}>{post.text}</Text>}

      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Beğen, ${post.likes + (isLiked ? 1 : 0)}`}
          accessibilityState={{ selected: isLiked }}
          onPress={() => toggleLike(post.id)}
          hitSlop={8}
          style={styles.action}>
          <Icon ios={isLiked ? 'heart.fill' : 'heart'} md="favorite" size={21} color={isLiked ? theme.accent : theme.text} />
          <Text style={[Type.subheadline, { color: theme.text, fontVariant: ['tabular-nums'] }]}>{post.likes + (isLiked ? 1 : 0)}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Paylaş"
          onPress={() => Share.share({ message: `${venue?.name ?? ''} · HERE'de bu gece #iamhere` })}
          hitSlop={8}
          style={styles.action}>
          <Icon ios="square.and.arrow.up" md="ios_share" size={20} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {venue && (
          <ActionButton
            title={iAmHere ? 'Sohbete katıl' : 'Mekâna git'}
            variant="tonal"
            size="regular"
            onPress={() =>
              iAmHere ? router.push({ pathname: '/chat/[id]', params: { id: `c-${venue.id}` } }) : openVenue()
            }
          />
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  ring: { padding: 2, borderWidth: 2 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  venueIcon: { alignItems: 'center', justifyContent: 'center' },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  card: { borderRadius: 26, padding: 14, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  venueLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, minHeight: 40, borderRadius: 12 },
  cardImage: { width: '100%', aspectRatio: 4 / 5, borderRadius: 14 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
});
