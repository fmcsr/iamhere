import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, type ReactNode } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, Share, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon, type SFSymbolName } from '@/components/icon';
import { Text } from '@/components/text';
import { Radius, Type } from '@/constants/theme';
import type { Category, Message, Post, User, Venue } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { strings, type Strings } from '@/i18n';
import { useT } from '@/i18n/use-t';
import { joinNames } from '@/lib/tr';

type IconPair = { ios: SFSymbolName; md: Parameters<typeof Icon>[0]['md'] };

export const CATEGORY_ICON: Record<Category, IconPair> = {
  konser: { ios: 'music.note', md: 'music_note' },
  bar: { ios: 'wineglass', md: 'local_bar' },
  yemek: { ios: 'fork.knife', md: 'restaurant' },
  kafe: { ios: 'cup.and.saucer', md: 'local_cafe' },
  acik: { ios: 'tree', md: 'park' },
};

/**
 * Dile bağlı yardımcılar sözlüğü (`t`) parametre olarak da alır: bileşenler `useT()` sonucunu verir ki React Compiler
 * sonucu dil değişince yeniden hesaplasın (yalnızca sayıya bağlı önbellekte eski dil kalıyordu).
 */
export function minutesAgo(ts: number, t: Strings = strings()): string {
  const { time } = t;
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return time.now;
  if (m < 60) return time.minutes(m);
  if (m < 24 * 60) return time.hours(Math.floor(m / 60));
  // Paylaşımlar kalıcı (K-16): eski olanlar gün olarak.
  const days = Math.floor(m / (24 * 60));
  return days === 1 ? time.yesterday : time.days(days);
}

/** Sohbet listesi ve önizlemeler için tek satırlık mesaj metni (plan kartları dahil). */
export function messagePreview(message: Message, t: Strings = strings()): string {
  return message.plan ? `${message.plan.emoji} ${t.plan}: ${message.plan.title} · ${message.plan.time}` : message.text;
}

export function formatDistance(meters: number, t: Strings = strings()): string {
  // Türkçede ondalık virgül ("1,8 km"), İngilizcede nokta ("1.8 km").
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1).replace('.', t.decimal)} km`;
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
        <View key={u.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32, borderRadius: size, borderWidth: 2, borderColor: theme.surface }}>
          <Avatar name={u.displayName} color={u.avatarColor} uri={u.avatarUri} size={size} />
        </View>
      ))}
    </View>
  );
}

/**
 * "● 342 kişi burada": nokta fuşya, metin nötr. `text` verilmezse yalnızca kişi sayısı ("342 kişi"). Sayı hep bir cam kartın ya da cam kontrolün üstünde
 * durduğu için küçük fuşya metin kullanılmaz (TASARIM.md §2.3 kural 5): koyu modda gri camda
 * kontrast 4.5:1'in altına düşüyor, iOS 27'nin cam renk ayarı da zemini değiştiriyor.
 */
export function LiveCount({ count, text }: { count: number; text?: string }) {
  const theme = useTheme();
  const t = useT();
  const label = text ?? t.people(count);
  return (
    <View style={styles.live} accessible accessibilityLabel={label}>
      <View style={[styles.dot, { backgroundColor: theme.accent }]} />
      <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
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
  const t = useT();
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
          {subtitle ?? `${t.categories[venue.category]} · ${formatDistance(venue.distanceM, t)}`}
        </Text>
      </View>
      {trailing ?? <LiveCount count={venue.here} />}
    </Pressable>
  );
}

/** Bildir / Engelle / Sessize al: her kişide ve paylaşımda bir dokunuş uzakta (TASARIM.md §1). */
export function showSafetyMenu(title: string) {
  const { safety, actions } = strings();
  const options = [safety.report, safety.block, safety.mute];
  const note = (index: number) => Alert.alert(options[index], safety.notSaved);
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { title, options: [...options, actions.cancel], cancelButtonIndex: 3, destructiveButtonIndex: [0, 1] },
      (index) => index < 3 && note(index),
    );
  } else {
    Alert.alert(title, undefined, [...options.map((text, i) => ({ text, onPress: () => note(i) })), { text: actions.cancel, style: 'cancel' }]);
  }
}

/**
 * Akış kartı (TASARIM.md §5.2, T-20): kişi ve mekân tek blokta → fotoğraf → yorum → eylemler.
 * Katman az: mekân bir satır bağlantı, eylem düz metin. Kart geçirgen cam (T-13, T-17).
 */
export function PostCard({ post }: { post: Post }) {
  const theme = useTheme();
  const t = useT();
  const { userById, venueById, liked, toggleLike, checkIn } = useApp();
  const lastTap = useRef(0);
  const user = userById(post.userId);
  const venue = venueById(post.venueId);
  const isLiked = liked.has(post.id);
  const anonymous = Boolean(post.anonAlias);
  const name = anonymous ? post.anonAlias! : user.displayName;
  const iAmHere = checkIn?.venueId === post.venueId;
  const others = (post.tagged ?? []).filter((id) => id !== 'me').map((id) => userById(id).displayName.split(' ')[0]);
  const withLine = post.tagged?.length
    ? post.tagged.includes('me')
      ? others.length
        ? t.card.withYouAnd(joinNames(others, t))
        : t.card.withYou
      : t.card.withNames(joinNames(others, t))
    : undefined;

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
          accessibilityLabel={name}>
          <Avatar name={user.displayName} color={user.avatarColor} uri={user.avatarUri} anonymous={anonymous} size={38} />
        </Pressable>
        <View style={{ flex: 1, gap: 1 }}>
          <Text numberOfLines={1} style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]}>
            {name}
            <Text style={{ color: theme.textSecondary, fontWeight: '400' }}> · {minutesAgo(post.createdAt, t)}</Text>
          </Text>
          {venue && (
            <Pressable onPress={openVenue} hitSlop={6} accessibilityRole="link" accessibilityLabel={`${venue.name}, ${venue.area}`}>
              <Text numberOfLines={1} style={[Type.footnote, { color: theme.textSecondary }]}>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{venue.name}</Text> · {venue.area}
              </Text>
            </Pressable>
          )}
          {withLine && (
            <View style={styles.withRow} accessible accessibilityLabel={withLine}>
              <Icon ios="person.2.fill" md="group" size={12} color={theme.textSecondary} />
              <Text numberOfLines={1} style={[Type.footnote, { color: theme.textSecondary }]}>
                {withLine}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => showSafetyMenu(name)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t.actions.more}
          style={styles.iconButton}>
          <Icon ios="ellipsis" md="more_horiz" size={18} color={theme.textSecondary} />
        </Pressable>
      </View>

      {post.imageUri && (
        <Pressable onPress={onPhotoPress} accessibilityHint={t.card.doubleTapToLike}>
          <Image
            source={{ uri: post.imageUri }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
            accessibilityLabel={t.card.photoAt(venue?.name ?? '')}
          />
        </Pressable>
      )}
      {post.text && <Text style={[Type.body, { color: theme.text }]}>{post.text}</Text>}

      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.card.like(post.likes + (isLiked ? 1 : 0))}
          accessibilityState={{ selected: isLiked }}
          onPress={() => toggleLike(post.id)}
          hitSlop={8}
          style={styles.action}>
          <Icon ios={isLiked ? 'heart.fill' : 'heart'} md="favorite" size={21} color={isLiked ? theme.accent : theme.text} />
          <Text style={[Type.subheadline, { color: theme.text, fontVariant: ['tabular-nums'] }]}>{post.likes + (isLiked ? 1 : 0)}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.actions.share}
          onPress={() => Share.share({ message: `${venue?.name ?? ''} · HERE #iamhere` })}
          hitSlop={8}
          style={styles.action}>
          <Icon ios="square.and.arrow.up" md="ios_share" size={20} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {venue && (
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => (iAmHere ? router.push({ pathname: '/chat/[id]', params: { id: `c-${venue.id}` } }) : openVenue())}
            style={styles.action}>
            <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]}>{iAmHere ? t.card.goToChat : t.card.venue}</Text>
            <Icon ios="chevron.right" md="chevron_right" size={12} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
    </GlassCard>
  );
}

/**
 * Ana sayfadaki mekân kartı (T-20, Uber Eats gibi): büyük fotoğraf, kalın ad, tek satır bilgi.
 * Çerçevesi yok; rengi fotoğraf taşır. Fotoğrafın üstünde kalabalık, altta orada olan tanıdıklar.
 */
export function VenueCard({
  venue,
  friends = [],
  width = 272,
  onPress,
}: {
  venue: Venue;
  friends?: User[];
  width?: number;
  /** Verilmezse mekân sayfası açılır (Mesajlar'da grup sohbetini açar). */
  onPress?: () => void;
}) {
  const theme = useTheme();
  const t = useT();
  return (
    <Pressable
      onPress={onPress ?? (() => router.push({ pathname: '/venue/[id]', params: { id: venue.id } }))}
      accessibilityRole="button"
      accessibilityLabel={t.venueCard.a11y(venue.name, t.categories[venue.category], formatDistance(venue.distanceM, t), venue.here)}
      style={({ pressed }) => [{ width, gap: 8, opacity: pressed ? 0.8 : 1 }]}>
      <View>
        <Image source={{ uri: venue.coverUri }} style={styles.venuePhoto} contentFit="cover" transition={200} />
        <View style={styles.crowd}>
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{t.people(venue.here)}</Text>
        </View>
      </View>
      <View style={{ gap: 2 }}>
        <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
          {venue.name}
        </Text>
        <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
          {t.categories[venue.category]} · {venue.area} · {formatDistance(venue.distanceM, t)}
        </Text>
      </View>
      {friends.length > 0 && (
        <View style={styles.friends}>
          <AvatarStack users={friends.slice(0, 3)} size={20} />
          <Text style={[Type.footnote, { color: theme.text, flexShrink: 1 }]} numberOfLines={1}>
            {t.venueCard.friendsThere(friends[0].displayName.split(' ')[0], friends.length - 1)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** "Bu gece" satırı: saat, etkinlik, mekân. */
export function EventRow({ venue, time, title }: { venue: Venue; time: string; title: string }) {
  const theme = useTheme();
  const t = useT();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/venue/[id]', params: { id: venue.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${time}, ${title}, ${venue.name}`}
      style={({ pressed }) => [styles.eventRow, { opacity: pressed ? 0.7 : 1 }]}>
      <Text style={[Type.headline, styles.eventTime, { color: theme.text }]}>{time}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[Type.footnote, { color: theme.textSecondary }]} numberOfLines={1}>
          {venue.name} · {formatDistance(venue.distanceM, t)}
        </Text>
      </View>
      <View style={{ alignSelf: 'center' }}>
        <Icon ios="chevron.right" md="chevron_right" size={13} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { padding: 2, borderWidth: 2 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  venueIcon: { alignItems: 'center', justifyContent: 'center' },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  card: { borderRadius: Radius.card, padding: 14, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  withRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  cardImage: { width: '100%', aspectRatio: 4 / 5, borderRadius: Radius.photo },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  venuePhoto: { width: '100%', aspectRatio: 16 / 11, borderRadius: Radius.photo },
  crowd: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  friends: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Saat, etkinlik başlığıyla aynı satırda başlar.
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 12 },
  eventTime: { width: 52, fontVariant: ['tabular-nums'] },
});
