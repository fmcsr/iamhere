import { router } from 'expo-router';
import { Share, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { HereRefreshIndicator, useHereRefresh } from '@/components/here-refresh';
import { PageColumn } from '@/components/page-column';
import { ProfileCover, useCoverStatusBar } from '@/components/profile-cover';
import { ProfileHeader } from '@/components/profile-header';
import { nightPhoto } from '@/components/profile-sections';
import { ProfileTabs } from '@/components/profile-tabs';
import { HeaderButton } from '@/components/screen-header';
import { StatusBarBlur } from '@/components/status-bar-blur';
import { Gap } from '@/constants/theme';
import { useApp } from '@/data/store';
import { editProfile } from '@/lib/profile';

/**
 * Kendi profilin (TASARIM.md §5.8, T-22, T-25): seçtiğin kapak ya da son gecenin fotoğrafından bulanık kapak, kimlik, sayılar ve
 * etiketler; altında üç sekme: Paylaşımlar, Etiketlenenler, To-HERE. "anı" sayısına dokununca anı takvimi açılır.
 * Düzenle, paylaş ve ayarlar kapaktaki cam düğmelerde. Başlık çubuğu yok: kapak ekranın en üstünden başlar.
 */
export default function ProfileScreen() {
  const { me, posts, settings, checkIn, venueById, followersOf, followingOf, nightsOf } = useApp();
  // Sekme içinde iOS durum çubuğu rengini değiştirmiyor; kapak üstünde ince geçiş kullanılıyor.
  const { onScroll, overCover } = useCoverStatusBar({ setStyle: false });
  const { ref, refreshControl, angle, pull } = useHereRefresh();

  const nights = nightsOf('me');
  const myPosts = posts.filter((p) => p.userId === 'me' && !p.anonAlias).sort((a, b) => b.createdAt - a.createdAt);
  const postById = (id: string) => posts.find((p) => p.id === id);
  const last = nights[0];
  // Seçtiğin kapak net; seçmediysen son gecenin fotoğrafı bulanık.
  const cover = me.coverUri ?? (last ? nightPhoto(last, postById, venueById(last.venueId)) : undefined);

  return (
    <View style={styles.screen} collapsable={false}>
      <Animated.ScrollView
        ref={ref}
        refreshControl={refreshControl}
        // iOS güvenli alanı kadar üst boşluk bırakır; kapak bu boşluk kadar yukarı taşınarak en üstten başlar.
        contentInsetAdjustmentBehavior="automatic"
        onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={styles.scroll}>
        <ProfileCover
          uri={cover ?? me.avatarUri}
          blur={!me.coverUri}
          title={`@${me.username}`}
          statusFade
          pull={pull}
          left={<HeaderButton icon="pencil" md="edit" label="Profili düzenle" onImage onPress={editProfile} />}
          right={
            <>
              <HeaderButton
                icon="square.and.arrow.up"
                md="ios_share"
                label="Profili paylaş"
                onImage
                onPress={() => Share.share({ message: `HERE'de @${me.username} #iamhere` })}
              />
              <HeaderButton icon="gearshape" md="settings" label="Ayarlar" onImage onPress={() => router.push('/settings')} />
            </>
          }
        />
        <PageColumn style={styles.content}>
          <ProfileHeader
            user={me}
            ring={Boolean(checkIn)}
            isPrivate={settings.privateAccount}
            followers={followersOf('me').length}
            following={followingOf('me').length}
            memories={nights.length}
            onFollowers={() => router.push({ pathname: '/follows', params: { user: 'me', tab: 'followers' } })}
            onFollowing={() => router.push({ pathname: '/follows', params: { user: 'me', tab: 'following' } })}
            onMemories={() => router.push({ pathname: '/nights', params: { user: 'me' } })}
          />

          <ProfileTabs userId="me" posts={myPosts} />
        </PageColumn>
      </Animated.ScrollView>
      <HereRefreshIndicator pull={pull} angle={angle} />
      {!overCover && <StatusBarBlur />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 48 },
  content: { paddingHorizontal: Gap.page, gap: 20 },
});
