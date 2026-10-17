import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { NightCalendar } from '@/components/night-calendar';
import { PageColumn } from '@/components/page-column';
import { SharedNights, nightPhoto } from '@/components/profile-sections';
import { Text } from '@/components/text';
import { Gap, TitleFonts, Type } from '@/constants/theme';
import type { Venue } from '@/data/mock';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { sharedNights, type Night } from '@/lib/nights';
import { genitive } from '@/lib/tr';

/** Kendi takviminin kimlere açık olduğu, "Şu an burada kimler görsün" ayarına bağlı. */
const NIGHTS_VISIBILITY = {
  herkes: 'Herkes görebilir',
  karsilikli: 'Yalnızca karşılıklı takipleştiklerin görür',
  kimse: 'Yalnızca sen görürsün',
} as const;

/**
 * Bir kişinin geceleri (TASARIM.md §5.8): profildeki "gece" sayısına dokununca açılan takvim. Dışarıda
 * olunan gecelerde o gecenin fotoğrafı; bir geceye dokununca altında özeti. Başkasının takviminin altında
 * birlikte olduğunuz geceler. Takvimi yalnızca kişinin kendisi ve karşılıklı takipleştikleri görür.
 */
export default function NightsScreen() {
  const theme = useTheme();
  const { user: userId = 'me' } = useLocalSearchParams<{ user?: string }>();
  const { users, posts, settings, venueById, userById, nightsOf, isMutual } = useApp();
  const mine = userId === 'me';
  const owner = userById(userId);
  const allowed = mine || isMutual(userId);

  const nights = allowed ? nightsOf(userId) : [];
  const myNights = nightsOf('me');
  const postById = (id: string) => posts.find((p) => p.id === id);
  const photoOf = (night: Night) => nightPhoto(night, postById, venueById(night.venueId));
  const sameNight = (a: Night) => (b: Night) => a.key === b.key && a.venueId === b.venueId;

  // Seçili gecenin alt satırı: paylaşım sayısı, sen de oradaysan o, değilse oradaki karşılıklı takipleştiklerin.
  const detailOf = (night: Night) => {
    const parts = [night.postIds.length ? `${night.postIds.length} paylaşım` : 'Paylaşım yok'];
    if (!mine && myNights.some(sameNight(night))) {
      parts.push('Sen de oradaydın');
    } else {
      const friends = users
        .filter((u) => u.id !== userId && isMutual(u.id) && nightsOf(u.id).some(sameNight(night)))
        .map((u) => u.displayName.split(' ')[0]);
      if (friends.length) parts.push(`${friends.slice(0, 2).join(' ve ')}${friends.length > 2 ? ` +${friends.length - 2}` : ''} de oradaydı`);
    }
    return parts.join(' · ');
  };
  const openNight = (night: Night) =>
    night.postIds.length
      ? router.push({ pathname: '/posts', params: { user: userId, start: night.postIds[0] } })
      : router.push({ pathname: '/venue/[id]', params: { id: night.venueId } });

  const shared = mine ? [] : sharedNights(myNights, nights);
  const myVenues = new Set(myNights.map((n) => n.venueId));
  const bothVenues = mine
    ? []
    : [...new Set(nights.map((n) => n.venueId))]
        .filter((id) => myVenues.has(id))
        .map((id) => venueById(id))
        .filter((v): v is Venue => Boolean(v));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      <Stack.Title {...TitleFonts}>{mine ? 'Gecelerin' : `${genitive(owner.displayName.split(' ')[0])} geceleri`}</Stack.Title>
      <PageColumn style={styles.content}>
        {allowed ? (
          <>
            <NightCalendar
              nights={nights}
              venueById={venueById}
              photoOf={photoOf}
              detailOf={detailOf}
              onOpenNight={openNight}
              privacy={
                mine
                  ? { label: NIGHTS_VISIBILITY[settings.presenceVisibility], onPress: () => router.push('/settings') }
                  : { label: 'Karşılıklı takipleştiğiniz için görüyorsun' }
              }
            />
            {(shared.length > 0 || bothVenues.length > 0) && (
              <SharedNights nights={shared} bothVenues={bothVenues} photoOf={photoOf} venueById={venueById} />
            )}
          </>
        ) : (
          <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>
            Gecelerini yalnızca karşılıklı takipleştikleri görür.
          </Text>
        )}
      </PageColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  content: { paddingHorizontal: Gap.page, paddingTop: 8, gap: Gap.section },
});
