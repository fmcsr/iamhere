import { router, Stack } from 'expo-router';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { Icon } from '@/components/icon';
import { LiveCount, PostCard, VenueIcon } from '@/components/kit';
import { ActionButton } from '@/components/native-controls';
import { PageColumn } from '@/components/page-column';
import { ProfileHeader } from '@/components/profile-header';
import { Text } from '@/components/text';
import { TitleFonts, Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

/**
 * Kendi profilin (TASARIM.md §5.8). Paylaşımlar kalıcı (K-16): tek bir "Paylaşımların" bölümü,
 * yer bildirmişsen en üstte "Şu an buradasın" kartı. Paylaş ve Ayarlar başlıkta, sistemin cam düğmelerinde.
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const { me, posts, settings, checkIn, venueById } = useApp();
  const myPosts = posts.filter((p) => p.userId === 'me');
  const current = checkIn ? venueById(checkIn.venueId) : undefined;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      <Stack.Title {...TitleFonts}>{`@${me.username}`}</Stack.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="square.and.arrow.up"
          accessibilityLabel="Profili paylaş"
          onPress={() => Share.share({ message: `HERE'de @${me.username} #iamhere` })}
        />
        <Stack.Toolbar.Button icon="gearshape" accessibilityLabel="Ayarlar" onPress={() => router.push('/settings')} />
      </Stack.Toolbar>

      <PageColumn style={styles.content}>
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
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  content: { padding: 16, paddingTop: 8, gap: 18 },
  section: { gap: 12 },
  nowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 14 },
  empty: { alignItems: 'center', gap: 10, borderRadius: 22, padding: 20 },
});
