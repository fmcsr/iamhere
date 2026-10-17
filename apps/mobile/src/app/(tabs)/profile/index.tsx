import { router } from 'expo-router';
import { ScrollView, Share, StyleSheet, View } from 'react-native';

import { NightCalendar } from '@/components/night-calendar';
import { PageColumn } from '@/components/page-column';
import { Pill } from '@/components/pill';
import { PostMasonry } from '@/components/post-masonry';
import { ProfileCover, useCoverStatusBar } from '@/components/profile-cover';
import { ProfileHeader } from '@/components/profile-header';
import { FrequentVenues, NightSummaryCard, NowCard, nightPhoto } from '@/components/profile-sections';
import { HeaderButton } from '@/components/screen-header';
import { StatusBarBlur } from '@/components/status-bar-blur';
import { Gap } from '@/constants/theme';
import type { Venue } from '@/data/mock';
import { useApp } from '@/data/store';
import { frequentVenues, summarize, tonightKey, type Night } from '@/lib/nights';
import { editProfile } from '@/lib/profile';

/** Gece takviminin kimlere açık olduğu, "Şu an burada kimler görsün" ayarına bağlı (TASARIM.md §5.8). */
const NIGHTS_VISIBILITY = {
  herkes: 'Herkes görebilir',
  karsilikli: 'Yalnızca karşılıklı takipleştiklerin görür',
  kimse: 'Yalnızca sen görürsün',
} as const;

/**
 * Kendi profilin, "gece pasaportu" (TASARIM.md §5.8, T-22): son gecenin fotoğrafından kapak, küçük
 * Düzenle düğmesi, şu an kartı, son 30 gün özeti, gece takvimi, sık gittiklerin ve Pinterest tipi
 * paylaşımlar. Başlık çubuğu yok: kapak ekranın en üstünden başlar, içerikle birlikte kayar.
 */
export default function ProfileScreen() {
  const { me, users, posts, settings, checkIn, venueById, followersOf, followingOf, nightsOf, isMutual } = useApp();
  // Sekme içinde iOS durum çubuğu rengini değiştirmiyor; kapak üstünde ince geçiş kullanılıyor.
  const { onScroll, overCover } = useCoverStatusBar({ setStyle: false });

  const nights = nightsOf('me');
  const summary = summarize(nights, venueById);
  const frequent = frequentVenues(nights)
    .map(({ venueId, count }) => ({ venue: venueById(venueId), count }))
    .filter((f): f is { venue: Venue; count: number } => Boolean(f.venue));
  const myPosts = posts.filter((p) => p.userId === 'me' && !p.anonAlias).sort((a, b) => b.createdAt - a.createdAt);
  const postById = (id: string) => posts.find((p) => p.id === id);
  const photoOf = (night: Night) => nightPhoto(night, postById, venueById(night.venueId));

  const current = checkIn ? venueById(checkIn.venueId) : undefined;
  const last = nights[0];
  const lastVenue = last ? venueById(last.venueId) : undefined;
  const chip = last && lastVenue ? `${last.key === tonightKey() ? 'Bu gece' : 'Son gece'} · ${lastVenue.name}` : undefined;

  // O gece orada olan karşılıklı takipleştiklerin ("Deniz de oradaydı").
  const mutuals = users.filter((u) => isMutual(u.id));
  const detailOf = (night: Night) => {
    const count = night.postIds.length;
    const friends = mutuals
      .filter((u) => nightsOf(u.id).some((n) => n.key === night.key && n.venueId === night.venueId))
      .map((u) => u.displayName.split(' ')[0]);
    const parts = [count ? `${count} paylaşım` : 'Paylaşım yok'];
    if (friends.length) parts.push(`${friends.slice(0, 2).join(' ve ')}${friends.length > 2 ? ` +${friends.length - 2}` : ''} de oradaydı`);
    return parts.join(' · ');
  };
  const openNight = (night: Night) =>
    night.postIds.length
      ? router.push({ pathname: '/posts', params: { user: 'me', start: night.postIds[0] } })
      : router.push({ pathname: '/venue/[id]', params: { id: night.venueId } });

  return (
    <View style={styles.screen} collapsable={false}>
      <ScrollView
        // iOS güvenli alanı kadar üst boşluk bırakır; kapak bu boşluk kadar yukarı taşınarak en üstten başlar.
        contentInsetAdjustmentBehavior="automatic"
        onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={styles.scroll}>
        <ProfileCover
          uri={(last ? photoOf(last) : undefined) ?? me.avatarUri}
          title={`@${me.username}`}
          chip={chip}
          statusFade
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
            ring={Boolean(current)}
            isPrivate={settings.privateAccount}
            followers={followersOf('me').length}
            following={followingOf('me').length}
            nights={summary.nights}
            onFollowers={() => router.push({ pathname: '/follows', params: { user: 'me', tab: 'followers' } })}
            onFollowing={() => router.push({ pathname: '/follows', params: { user: 'me', tab: 'following' } })}
            actions={<Pill title="Düzenle" icon={{ ios: 'pencil', md: 'edit' }} onPress={editProfile} accessibilityLabel="Profili düzenle" />}
          />

          {current ? (
            <NowCard
              venue={current}
              caption={checkIn?.anonAlias ? `Anonim · ${checkIn.anonAlias}` : 'Şu an buradasın'}
              title={current.name}
              action={{ title: 'Sohbet', onPress: () => router.push({ pathname: '/chat/[id]', params: { id: `c-${current.id}` } }) }}
            />
          ) : (
            <NowCard caption="Bu gece" title="Neredesin?" action={{ title: 'Buradayım', onPress: () => router.navigate('/checkin') }} />
          )}

          <NightSummaryCard summary={summary} />

          <NightCalendar
            nights={nights}
            venueById={venueById}
            photoOf={photoOf}
            detailOf={detailOf}
            onOpenNight={openNight}
            privacy={{ label: NIGHTS_VISIBILITY[settings.presenceVisibility], onPress: () => router.push('/settings') }}
          />

          {frequent.length > 0 && <FrequentVenues items={frequent} />}

          <PostMasonry posts={myPosts} onOpen={(post) => router.push({ pathname: '/posts', params: { user: 'me', start: post.id } })} />
        </PageColumn>
      </ScrollView>
      {!overCover && <StatusBarBlur />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 48 },
  content: { paddingHorizontal: Gap.page, gap: 26 },
});
