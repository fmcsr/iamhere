import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { PostCard } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { ProfileHeader } from '@/components/profile-header';
import { Text } from '@/components/text';
import { TitleFonts, Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

/**
 * Başkasının profili (TASARIM.md §5.8). Takip düğmesi tek yerde durum değiştirir:
 * Takip et (metin renginde dolgu, T-7) → İstek gönderildi → Takip ediliyor.
 * Engelle / Bildir / Sessize al başlıktaki ••• menüsünde.
 */
export default function UserProfileScreen() {
  const theme = useTheme();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { users, posts, following, toggleFollow, followRequests, toggleFollowRequest, isMutual, openDirect, venueById } = useApp();
  const user = users.find((u) => u.username === username);

  if (!user) return <Text style={{ color: theme.text, padding: 16 }}>Kullanıcı bulunamadı.</Text>;

  const isFollowing = following.has(user.id);
  const requested = followRequests.has(user.id);
  const mutual = isMutual(user.id);
  const locked = user.isPrivate && !isFollowing;
  // Anonim paylaşımlar profile asla bağlanmaz.
  const theirPosts = posts.filter((p) => p.userId === user.id && !p.anonAlias && (p.audience === 'herkes' || isFollowing));
  const here = mutual ? theirPosts[0] : undefined;
  const note = (title: string) => Alert.alert(title, 'Prototipte bu işlem henüz kaydedilmiyor.');

  const onFollowPress = () => {
    if (isFollowing) {
      Alert.alert(`@${user.username} takibi bırakılsın mı?`, undefined, [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Takibi bırak', style: 'destructive', onPress: () => toggleFollow(user.id) },
      ]);
    } else if (user.isPrivate) {
      toggleFollowRequest(user.id);
    } else {
      toggleFollow(user.id);
    }
  };
  const follow = isFollowing
    ? { title: 'Takip ediliyor', icon: 'checkmark' as const, filled: false }
    : requested
      ? { title: 'İstek gönderildi', icon: 'clock' as const, filled: false }
      : { title: user.isPrivate ? 'İstek gönder' : 'Takip et', icon: undefined, filled: true };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      <Stack.Title {...TitleFonts}>{`@${user.username}`}</Stack.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="Diğer seçenekler">
          <Stack.Toolbar.MenuAction icon="speaker.slash" onPress={() => note('Sessize al')}>
            Sessize al
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction icon="exclamationmark.bubble" onPress={() => note('Bildir')}>
            Bildir
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction icon="hand.raised" destructive onPress={() => note('Engelle')}>
            Engelle
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <PageColumn style={styles.content}>
        <ProfileHeader user={user} followers={user.followers + (isFollowing ? 1 : 0)} isPrivate={user.isPrivate} />

        <View style={styles.actions}>
          <ActionButton
            title={follow.title}
            systemImage={follow.icon}
            variant={follow.filled ? 'filled' : 'tonal'}
            color={theme.text}
            labelColor={theme.inverseText}
            fullWidth
            style={{ flex: 1 }}
            onPress={onFollowPress}
          />
          <ActionButton
            title="Mesaj"
            variant="tonal"
            fullWidth
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: openDirect(user.id) } })}
          />
        </View>
        <Text style={[Type.footnote, { color: theme.textSecondary }]}>
          {mutual
            ? 'Karşılıklı takipleşiyorsunuz: mesajın doğrudan gelen kutusuna düşer.'
            : 'Karşılıklı takipleşmediğiniz için mesajın onun “İstekler” bölümüne düşer.'}
        </Text>

        {here && (
          <GlassCard
          onPress={() => router.push({ pathname: '/venue/[id]', params: { id: here.venueId } })}
          style={styles.here}>
            <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600', flex: 1 }]}>
              Şu an {venueById(here.venueId)?.name}
            </Text>
            <Icon ios="chevron.right" md="chevron_right" size={13} color={theme.textSecondary} />
          </GlassCard>
        )}

        {locked ? (
          <GlassCard style={styles.lockedBox}>
            <Icon ios="lock.fill" md="lock" size={26} color={theme.text} />
            <Text style={[Type.headline, { color: theme.text }]}>Bu hesap gizli</Text>
            <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>
              Bu geceki yer bildirimlerini görmek için takip isteği gönder.
            </Text>
          </GlassCard>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={[Type.section, { color: theme.text }]}>Paylaşımlar</Text>
            {theirPosts.length === 0 && <Text style={[Type.subheadline, { color: theme.textSecondary }]}>Bu gece paylaşım yok.</Text>}
            {theirPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </View>
        )}
      </PageColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  content: { padding: 16, paddingTop: 8, gap: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  here: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  lockedBox: { alignItems: 'center', gap: 8, padding: 24, borderRadius: 22 },
});
