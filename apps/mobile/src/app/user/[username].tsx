import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { useSafetyMenu } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
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
import { useT } from '@/i18n/use-t';

/**
 * Başkasının profili (TASARIM.md §5.8, T-22, T-25): kendi profilinle aynı düzen; Mesaj ve Takip et küçük
 * kapsüllerde, etiketlerin altında üç sekme (Paylaşımlar, Etiketlenenler, To-HERE). Profil, paylaşımlar ve geçmiş
 * geceler hesabın gizliliğine uyar: gizli hesapta onaylı takipçi değilsen kilit, sayılar görünür ama dokunulamaz.
 * Halka ve takvimdeki bu gece kişinin "Şu an burada kimler görsün" ayarına uyar (S4). Bildir / Engelle / Sessize al
 * kapaktaki •••'de.
 */
export default function UserProfileScreen() {
  const theme = useTheme();
  const t = useT();
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
    nightCountOf,
    isOutTonight,
    canSeeProfile,
    blocked,
    unblock,
  } = useApp();
  const safetyMenu = useSafetyMenu();
  const { onScroll, overCover } = useCoverStatusBar();
  const user = users.find((u) => u.username === username);

  if (!user) return <Text style={{ color: theme.text, padding: 16 }}>{t.profile.user.notFound}</Text>;

  const isFollowing = following.has(user.id);
  const requested = followRequests.has(user.id);
  const mutual = isMutual(user.id);
  const locked = !canSeeProfile(user.id);
  const isBlocked = blocked.includes(user.id);
  // Paylaşımlar hesabın gizliliğine uyar (S2).
  const theirPosts = locked ? [] : posts.filter((p) => p.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  const postById = (id: string) => posts.find((p) => p.id === id);

  const last = nightsOf(user.id)[0];
  const cover = user.coverUri ?? theirPosts[0]?.imageUri ?? (last ? nightPhoto(last, postById, venueById(last.venueId)) : undefined);

  const onFollowPress = () => {
    if (isFollowing) {
      Alert.alert(t.profile.follow.unfollowConfirm(user.username), undefined, [
        { text: t.actions.cancel, style: 'cancel' },
        { text: t.profile.follow.unfollow, style: 'destructive', onPress: () => toggleFollow(user.id) },
      ]);
    } else if (user.isPrivate) {
      toggleFollowRequest(user.id);
    } else {
      toggleFollow(user.id);
    }
  };
  const follow = t.profile.follow;
  const followTitle = isFollowing ? follow.following : requested ? follow.requested : user.isPrivate ? follow.request : followsMe(user.id) ? follow.followBack : follow.follow;

  return (
    <View style={styles.screen} collapsable={false}>
      <ScrollView
        // iOS güvenli alanı kadar üst boşluk bırakır; kapak bu boşluk kadar yukarı taşınarak en üstten başlar.
        contentInsetAdjustmentBehavior="automatic"
        onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={styles.scroll}>
        <ProfileCover
          uri={(locked ? undefined : cover) ?? user.avatarUri}
          blur={locked || !user.coverUri}
          title={`@${user.username}`}
          left={<HeaderButton icon="chevron.left" md="arrow_back" label={t.actions.back} onImage onPress={() => router.back()} />}
          right={<HeaderButton icon="ellipsis" md="more_horiz" label={t.actions.more} onImage onPress={() => safetyMenu({ title: `@${user.username}`, userId: user.id, kind: 'user', id: user.id })} />}
        />
        <PageColumn style={styles.content}>
          <View style={{ gap: 10 }}>
            <ProfileHeader
              user={user}
              ring={isOutTonight(user.id)}
              isPrivate={user.isPrivate}
              followers={followersOf(user.id).length}
              following={followingOf(user.id).length}
              memories={nightCountOf(user.id)}
              onFollowers={locked ? undefined : () => router.push({ pathname: '/follows', params: { user: user.id, tab: 'followers' } })}
              onFollowing={locked ? undefined : () => router.push({ pathname: '/follows', params: { user: user.id, tab: 'following' } })}
              onMemories={locked ? undefined : () => router.push({ pathname: '/nights', params: { user: user.id } })}
              actions={
                isBlocked ? undefined : (
                  <>
                    <Pill
                      title={t.profile.user.message}
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
                )
              }
            />
            {!mutual && !isBlocked && (
              <Text style={[Type.footnote, { color: theme.textSecondary }]}>{t.profile.user.requestNote}</Text>
            )}
          </View>

          {isBlocked ? (
            <GlassCard style={styles.lockedBox}>
              <Icon ios="hand.raised.fill" md="block" size={26} color={theme.text} />
              <Text style={[Type.headline, { color: theme.text }]}>{t.profile.user.blockedTitle}</Text>
              <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>{t.profile.user.blockedNote}</Text>
              <ActionButton title={t.safety.unblock} variant="tonal" size="regular" onPress={() => unblock(user.id)} />
            </GlassCard>
          ) : locked ? (
            <GlassCard style={styles.lockedBox}>
              <Icon ios="lock.fill" md="lock" size={26} color={theme.text} />
              <Text style={[Type.headline, { color: theme.text }]}>{t.profile.user.privateTitle}</Text>
              <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>{t.profile.user.privateNote}</Text>
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
