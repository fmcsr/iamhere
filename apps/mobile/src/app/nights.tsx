import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { NightCalendar } from '@/components/night-calendar';
import { PageColumn } from '@/components/page-column';
import { nightPhoto } from '@/components/profile-sections';
import { Text } from '@/components/text';
import { Gap, TitleFonts, Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';
import type { Night } from '@/lib/nights';
import { genitive } from '@/lib/tr';

/**
 * Anılar (TASARIM.md §5.8): profildeki "anı" sayısına dokununca açılan takvim. Dışarıda olunan
 * gecelerde o gecenin fotoğrafı; bir geceye dokununca o gecenin paylaşımları (yoksa mekân) açılır.
 * Takvimin altında başka bir şey yok. Takvimi yalnızca kişinin kendisi ve karşılıklı takipleştikleri görür.
 */
export default function MemoriesScreen() {
  const theme = useTheme();
  const t = useT();
  const { user: userId = 'me' } = useLocalSearchParams<{ user?: string }>();
  const { posts, settings, venueById, userById, nightsOf, isMutual } = useApp();
  const mine = userId === 'me';
  const owner = userById(userId);
  const allowed = mine || isMutual(userId);

  const nights = allowed ? nightsOf(userId) : [];
  const postById = (id: string) => posts.find((p) => p.id === id);
  const photoOf = (night: Night) => nightPhoto(night, postById, venueById(night.venueId));
  const openNight = (night: Night) =>
    night.postIds.length
      ? router.push({ pathname: '/posts', params: { user: userId, start: night.postIds[0] } })
      : router.push({ pathname: '/venue/[id]', params: { id: night.venueId } });

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
      <Stack.Title {...TitleFonts}>{mine ? t.profile.memories.titleMine : t.profile.memories.title(genitive(owner.displayName.split(' ')[0], t))}</Stack.Title>
      <PageColumn style={styles.content}>
        {allowed ? (
          <NightCalendar
            nights={nights}
            venueById={venueById}
            photoOf={photoOf}
            onOpenNight={openNight}
            privacy={
              mine
                ? { label: t.profile.memories.visibility[settings.presenceVisibility], onPress: () => router.push('/settings') }
                : { label: t.profile.memories.mutual }
            }
          />
        ) : (
          <Text style={[Type.subheadline, { color: theme.textSecondary, textAlign: 'center' }]}>{t.profile.memories.hidden}</Text>
        )}
      </PageColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  content: { paddingHorizontal: Gap.page, paddingTop: 8 },
});
