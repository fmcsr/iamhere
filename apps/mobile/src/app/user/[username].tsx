import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { showSafetyMenu } from '@/components/kit';
import { PageColumn } from '@/components/page-column';
import { Pill } from '@/components/pill';
import { ProfileCover, useCoverStatusBar } from '@/components/profile-cover';
import { ProfileHeader } from '@/components/profile-header';
import { nightPhoto } from '@/components/profile-sections';
import { ProfileTabs } from '@/components/profile-tabs';
import { HeaderButton } from '@/components/screen-header';
import { StatusBarBlur } from '@/components/status-bar-blur';
import { Text } from '@/components/text';
import { Gap, Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { tonightKey } from '@/lib/nights';

/**
 * Başkasının profili (TASARIM.md §5.8, T-22, T-25): kendi profilinle aynı düzen; Mesaj ve Takip et küçük
 * kapsüllerde, etiketlerin altında üç sekme (Paylaşımlar, Etiketlenenler, To-HERE). "anı" sayısı ve anı takvimi
 * yalnızca karşılıklı takipleşenlere açık. Bildir / Engelle / Sessize al kapaktaki •••'de.
 */
export default function UserProfileScreen() {
  const theme = useTheme();
  const { username } = useLocalSearchParams<{ username: string }>();
  const {
    users,
    posts,
    following,
    toggleFollow,
    followRequests,
    toggleFollowRequest,
    isMutual,
    followsMe,
    openDirect,
    venueById,
    followersOf,
    followingOf,
    nightsOf,
  } = useApp();
  const { onScroll, overCover } = useCoverStatusBar();
  const user = users.find((u) => u.username === username);

  if (!user) return <Text style={{ color: theme.text, padding: 16 }}>Kullanıcı bulunamadı.</Text>;

  const isFollowing = following.has(user.id);
  const requested = followRequests.has(user.id);
  const mutual = isMutual(user.id);
  const locked = user.isPrivate && !isFollowing;
  // Anonim paylaşımlar profile asla bağlanmaz; takipçilere özel olanları yalnızca takipçiler görür.
  const theirPosts = posts
    .filter((p) => p.userId === user.id && !p.anonAlias && (p.audience === 'herkes' || isFollowing))
    .sort((a, b) => b.createdAt - a.createdAt);
  const postById = (id: string) => posts.find((p) => p.id === id);

  // Karşılıklı değilse yer bildirimleri görünmez; yalnızca görebildiğin paylaşımların geceleri.
  const theirNights = nightsOf(user.id, mutual ? {} : { onlyPosts: true, visiblePosts: theirPosts });
  const tonight = theirNights[0]?.key === tonightKey();
  const last = theirNights[0];
  const cover = theirPosts.find((p) => p.imageUri)?.imageUri ?? (last ? nightPhoto(last, postById, venueById(last.venueId)) : undefined);

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
  const followTitle = isFollowing ? 'Takip ediliyor' : requested ? 'İstek gönderildi' : user.isPrivate ? 'İstek gönder' : followsMe(user.id) ? 'Geri takip et' : 'Takip et';

  return (
    <View style={styles.screen} collapsable={false}>
      <ScrollView
        // iOS güvenli alanı kadar üst boşluk bırakır; kapak bu boşluk kadar yukarı taşınarak en üstten başlar.
        contentInsetAdjustmentBehavior="automatic"
        onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={styles.scroll}>
        <ProfileCover
          uri={(locked ? undefined : cover) ?? user.avatarUri}
          title={`@${user.username}`}
          left={<HeaderButton icon="chevron.left" md="arrow_back" label="Geri" onImage onPress={() => router.back()} />}
          right={<HeaderButton icon="ellipsis" md="more_horiz" label="Diğer seçenekler" onImage onPress={() => showSafetyMenu(`@${user.username}`)} />}
        />
        <PageColumn style={styles.content}>
          <View style={{ gap: 10 }}>
            <ProfileHeader
              user={user}
              ring={tonight && mutual}
              isPrivate={user.isPrivate}
              followers={followersOf(user.id).length}
              following={followingOf(user.id).length}
              memories={mutual ? theirNights.length : undefined}
              onFollowers={() => router.push({ pathname: '/follows', params: { user: user.id, tab: 'followers' } })}
              onFollowing={() => router.push({ pathname: '/follows', params: { user: user.id, tab: 'following' } })}
              onMemories={() => router.push({ pathname: '/nights', params: { user: user.id } })}
              actions={
                <>
                  <Pill
                    title="Mesaj"
                    icon={{ ios: 'bubble.left', md: 'chat_bubble_outline' }}
                    onPress={() => router.push({ pathname: '/chat/[id]', params: { id: openDirect(user.id) } })}
                  />
                  <Pill
                    title={followTitle}
                    tone={isFollowing || requested ? 'fill' : 'ink'}
                    icon={isFollowing ? { ios: 'checkmark', md: 'check' } : requested ? { ios: 'clock', md: 'schedule' } : undefined}
                    onPress={onFollowPress}
                  />
                </>
              }
            />
            {!mutual && (
              <Text style={[Type.footnote, { color: theme.textSecondary }]}>
                Karşılıklı takipleşmediğiniz için mesajın onun “İstekler” bölümüne düşer.
              </Text>
            )}
          </View>

          {locked ? (
            <GlassCard style={styles.lockedBox}>
              <Icon ios="lock.fill" md="lock" size={26} color={theme.text} />
              <Text style={[Type.headline, { color: theme.text }]}>Bu hesap gizli</Text>
              <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>
                Paylaşımlarını ve gecelerini görmek için takip isteği gönder.
              </Text>
            </GlassCard>
          ) : (
            <ProfileTabs userId={user.id} posts={theirPosts} />
          )}
        </PageColumn>
      </ScrollView>
      {!overCover && <StatusBarBlur />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 48 },
  content: { paddingHorizontal: Gap.page, gap: 20 },
  lockedBox: { alignItems: 'center', gap: 8, padding: 24, borderRadius: 22 },
});
