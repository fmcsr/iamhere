import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import type { Venue } from '@/data/mock';
import { strings, type Strings } from '@/i18n';

/**
 * "Hâlâ orada mısın?" (K-06, 28.10.2026): yer bildirdikten 3 saat sonra bir kez sorulur; "Evet, buradayım"
 * canlı sayıda tutar, "Ayrıldım" yer bildirimini kapatır (sohbet 04:00'e kadar okunur). Cevapsızsa hiçbir şey
 * değişmez. Telefonun kendi (yerel) bildirimi: sunucu ve bildirim servisi yok, maliyeti yok. Başka yerde yer
 * bildirince ya da "Ayrıldım" deyince iptal edilir.
 */
const ASK_AFTER_S = 3 * 60 * 60;
/** Sabit kimlik: yeni yer bildirimi bekleyen soruyu değiştirir, iptal için kimliği saklamak gerekmez. */
const REQUEST_ID = 'still-here';
const CATEGORY = 'stillhere';
const YES = 'yes';
const LEFT = 'left';

// Uygulama açıkken gelen bildirim de üstte görünsün.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** Yer bildirince çağrılır: izin yoksa bir kez sorar, 3 saat sonrasına soruyu kurar. */
export async function scheduleStillHere(venue: Venue, t: Strings = strings()) {
  let { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  if (!granted && canAskAgain) ({ granted } = await Notifications.requestPermissionsAsync());
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    identifier: REQUEST_ID,
    content: { title: t.home.stillHere.title, body: t.home.stillHere.body(venue.name), categoryIdentifier: CATEGORY, data: { venueId: venue.id } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: ASK_AFTER_S },
  });
}

export async function cancelStillHere() {
  await Notifications.cancelScheduledNotificationAsync(REQUEST_ID);
}

/**
 * Bildirimin düğmeleri ve cevabı. Düğme yazıları seçili dilde (dil değişince yeniden kaydedilir). Bildirime
 * dokununca o mekânın sohbeti açılır.
 */
export function useStillHereResponses(t: Strings, { onStillHere, onLeft }: { onStillHere: () => void; onLeft: () => void }) {
  useEffect(() => {
    Notifications.setNotificationCategoryAsync(CATEGORY, [
      { identifier: YES, buttonTitle: t.home.stillHere.yes, options: { opensAppToForeground: false } },
      { identifier: LEFT, buttonTitle: t.home.leave.button, options: { isDestructive: true, opensAppToForeground: true } },
    ]).catch(() => {});
  }, [t]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const venueId = response.notification.request.content.data?.venueId;
      if (response.actionIdentifier === YES) onStillHere();
      else if (response.actionIdentifier === LEFT) onLeft();
      else if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER && typeof venueId === 'string') {
        router.push({ pathname: '/chat/[id]', params: { id: `c-${venueId}` } });
      }
    });
    return () => subscription.remove();
  }, [onStillHere, onLeft]);
}
