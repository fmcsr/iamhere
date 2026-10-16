import { useEffect, useState } from 'react';

// Gece 04:00'te (İstanbul, UTC+3, yaz saati yok) sohbetler sıfırlanır; paylaşımlar kalır (K-16).
// Üretimde bu an sunucudan gelir (ephemeral.cycle_expires_at); burada yalnızca prototip için hesaplanır.
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
const RESET_HOUR = 4;

export function nextReset(now: Date): Date {
  const local = new Date(now.getTime() + ISTANBUL_OFFSET_MS);
  const reset = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), RESET_HOUR),
  );
  if (local.getTime() >= reset.getTime()) reset.setUTCDate(reset.getUTCDate() + 1);
  return new Date(reset.getTime() - ISTANBUL_OFFSET_MS);
}

export function minutesLeft(now: Date): number {
  return Math.max(0, Math.floor((nextReset(now).getTime() - now.getTime()) / 60000));
}

export function formatRemaining(now: Date): string {
  const minutes = minutesLeft(now);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} sa ${m} dk` : `${m} dk`;
}

/** 04:00'e kalan süre; yarım dakikada bir güncellenir. `lastHour`: son 60 dakika (sayaç fuşyaya döner). */
export function useNight(): { remaining: string; lastHour: boolean } {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return { remaining: formatRemaining(now), lastHour: minutesLeft(now) < 60 };
}

export function useNightRemaining(): string {
  return useNight().remaining;
}

export function clockTime(date: Date): string {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
}

/** Yeni plan için önerilen saat: en az 30 dk sonrasının ilk yarım saati, en geç 03:30. */
export function suggestedPlanTime(now: Date): string {
  const step = 30 * 60_000;
  const start = Math.ceil((now.getTime() + step) / step) * step;
  const latest = nextReset(now).getTime() - step;
  return clockTime(new Date(Math.min(start, latest)));
}
