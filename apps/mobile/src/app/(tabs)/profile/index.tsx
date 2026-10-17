import { router } from 'expo-router';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { LiveCount, PostCard, VenueIcon } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { ProfileHeader } from '@/components/profile-header';
import { HeaderButton, ScreenHeader } from '@/components/screen-header';
import { StatusBarBlur } from '@/components/status-bar-blur';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

/**
 * Kendi profilin (TASARIM.md §5.8). Paylaşımlar kalıcı (K-16): tek bir "Paylaşımların" bölümü,
 * yer bildirmişsen en üstte "Şu an buradasın" kartı. Başlık çubuğu yok: kullanıcı adı ve cam düğmeler içerikle
 * birlikte kayar; üstte yalnızca Dynamic Island çevresinde bulanıklık (ana sayfa gibi).
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const { me, posts, settings, checkIn, venueById } = useApp();
  const myPosts = posts.filter((p) => p.userId === 'me');
  const current = checkIn ? venueById(checkIn.venueId) : undefined;

  return (
    <View style={{ flex: 1 }} collapsable={false}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <PageColumn style={styles.content}>
          <ScreenHeader
            title={`@${me.username}`}
            right={
              <>
                <HeaderButton
                  icon="square.and.arrow.up"
                  md="ios_share"
                  label="Profili paylaş"
                  onPress={() => Share.share({ message: `HERE'de @${me.username} #iamhere` })}
                />
                <HeaderButton icon="gearshape" md="settings" label="Ayarlar" onPress={() => router.push('/settings')} />
              </>
            }
          />
          <ProfileHeader user={me} isPrivate={settings.privateAccount} />
          <ActionButton
            title="Profili düzenle"
            variant="tonal"
            fullWidth
            onPress={() => Alert.alert('Profili düzenle', 'Prototipte henüz yok.')}
          />

          <View style={styles.section}>
            <Text style={[Type.section, { color: theme.text }]}>Paylaşımların{myPosts.length ? ` · ${myPosts.length}` : ''}</Text>
            {current ? (
              <GlassCard style={styles.nowCard}>
                <VenueIcon category={current.category} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[Type.footnote, { color: theme.textSecondary }]}>
                    {checkIn?.anonAlias ? `Anonim · ${checkIn.anonAlias}` : 'Şu an buradasın'}
                  </Text>
                  <Text style={[Type.headline, { color: theme.text }]} numberOfLines={1}>
                    {current.name}
                  </Text>
                  <LiveCount count={current.here} suffix="kişi burada" />
                </View>
              </GlassCard>
            ) : myPosts.length === 0 ? (
              <GlassCard style={styles.empty}>
                <Icon ios="moon.stars" md="bedtime" size={26} color={theme.textSecondary} />
                <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>
                  Henüz bir yer bildirmedin. Bulunduğun mekânda yer bildirdiğinde paylaşımların burada görünür.
                </Text>
                <ActionButton title="Buradayım" size="regular" onPress={() => router.navigate('/checkin')} />
              </GlassCard>
            ) : null}
            {myPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </View>
        </PageColumn>
      </ScrollView>
      <StatusBarBlur />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  content: { padding: 16, paddingTop: 8, gap: 18 },
  section: { gap: 12 },
  nowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 14 },
  empty: { alignItems: 'center', gap: 10, borderRadius: 22, padding: 20 },
});
