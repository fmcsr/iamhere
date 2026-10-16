import { router } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { VenueIcon } from '@/components/kit';
import { Text } from '@/components/text';
import { Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useNight } from '@/lib/night';

/**
 * Yer bildirmişken sekme çubuğunun üstünde yüzen cam aksesuar (T-1): mekân, kişi sayısı ve
 * 04:00'e kalan süre. Dokununca mekân sohbeti açılır. Camı sistem çizer; burada yalnızca içerik var.
 * Sekme çubuğu küçüldüğünde (`inline`) tek satıra iner.
 */
export function NowHereAccessory() {
  const theme = useTheme();
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const { checkIn, venueById } = useApp();
  const { remaining, lastHour } = useNight();
  const venue = checkIn ? venueById(checkIn.venueId) : undefined;
  if (!venue) return null;

  const inline = placement === 'inline';
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: `c-${venue.id}` } })}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name} sohbetini aç. ${venue.here} kişi burada, sohbetin sıfırlanmasına ${remaining} kaldı`}
      style={[styles.row, inline && styles.inlineRow]}>
      {inline ? (
        <View style={[styles.dot, { backgroundColor: theme.accent }]} />
      ) : (
        <VenueIcon category={venue.category} size={30} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={[Type.subheadline, { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>
          {venue.name}
        </Text>
        {!inline && (
          <View style={styles.meta}>
            <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            <Text style={[Type.caption, { color: theme.textSecondary, fontVariant: ['tabular-nums'] }]} numberOfLines={1}>
              {venue.here} kişi · {remaining}
            </Text>
            {lastHour && <Icon ios="hourglass" md="hourglass_top" size={11} color={theme.accent} />}
          </View>
        )}
      </View>
      <Icon ios="bubble.left.and.bubble.right.fill" md="forum" size={inline ? 16 : 18} color={theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  inlineRow: { gap: 8, paddingHorizontal: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
