import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';

import type { Venue } from '@/data/mock';
import type { Strings } from '@/i18n';

/** Haritalar'da yol tarifi: uzaktaki mekânda tek düğme bu (S5). */
export function openDirections(venue: Venue) {
  Linking.openURL(`https://maps.apple.com/?daddr=${venue.latitude},${venue.longitude}`);
}

/**
 * Alttan yer bildirme sayfasını açar. Başka bir mekânda yer bildirmişsen önce onay sorulur (K-06): aynı anda
 * tek mekân; önceki mekânın sohbeti 04:00'e kadar okunur, yazılamaz. `fromChat`: iğne saplanınca sohbete dönülür.
 */
export function startCheckIn(t: Strings, venue: Venue, current: Venue | undefined, fromChat = false) {
  const open = () =>
    router.push({ pathname: '/check-in/[venueId]', params: fromChat ? { venueId: venue.id, from: 'chat' } : { venueId: venue.id } });
  if (!current || current.id === venue.id) return open();
  Alert.alert(t.home.switchVenue.title, t.home.switchVenue.message(current.name, venue.name), [
    { text: t.actions.cancel, style: 'cancel' },
    { text: t.home.switchVenue.confirm, onPress: open },
  ]);
}

/** "Ayrıldım" onayı (K-06): sohbet 04:00'e kadar okunur, yazılamaz. */
export function confirmLeave(t: Strings, venue: Venue, leave: () => void) {
  Alert.alert(t.home.leave.title, t.home.leave.message(venue.name), [
    { text: t.actions.cancel, style: 'cancel' },
    { text: t.home.leave.button, style: 'destructive', onPress: leave },
  ]);
}
