import type { Post } from '@/data/mock';
import { ISTANBUL_OFFSET_MS, RESET_HOUR } from '@/lib/night';

/**
 * Geceler: bir kişinin yer bildirdiği ya da paylaşım yaptığı geceler. Gece, akşam başlar ve ertesi
 * sabah 04:00'te biter; bu yüzden 02:00'deki bir paylaşım bir önceki günün gecesine sayılır.
 * Anahtar "YYYY-AA-GG": gecenin başladığı gün (İstanbul).
 */
export type Night = { key: string; venueId: string; postIds: string[] };

export const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const WEEKDAYS_SHORT = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');
const keyOfUtc = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** Gün numarası (1970'ten beri): anahtarlar arasında gün farkı ve hafta hesabı için. */
export function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function keyFromDayNumber(n: number): string {
  return keyOfUtc(new Date(n * DAY_MS));
}

/** Bir anın ait olduğu gece. */
export function nightKeyOf(timestamp: number): string {
  return keyOfUtc(new Date(timestamp + ISTANBUL_OFFSET_MS - RESET_HOUR * 3_600_000));
}

export function tonightKey(now = Date.now()): string {
  return nightKeyOf(now);
}

/** "Cuma, 16 Ekim" */
export function longDate(key: string): string {
  const n = dayNumber(key);
  const d = new Date(n * DAY_MS);
  return `${WEEKDAYS[(d.getUTCDay() + 6) % 7]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Kişinin geceleri: geçmiş yer bildirimleri, paylaşımlarından çıkan geceler ve bu geceki yer bildirimi. Yeniden eskiye. */
export function collectNights({
  history = [],
  posts = [],
  tonightVenueId,
  now = Date.now(),
}: {
  history?: { daysAgo: number; venueId: string }[];
  posts?: Post[];
  tonightVenueId?: string;
  now?: number;
}): Night[] {
  const today = dayNumber(tonightKey(now));
  const byKey = new Map<string, Night>();
  const at = (key: string, venueId: string) => {
    const existing = byKey.get(key);
    if (existing) return existing;
    const created = { key, venueId, postIds: [] as string[] };
    byKey.set(key, created);
    return created;
  };
  for (const h of history) at(keyFromDayNumber(today - h.daysAgo), h.venueId);
  for (const p of posts) at(nightKeyOf(p.createdAt), p.venueId).postIds.push(p.id);
  if (tonightVenueId) byKey.set(keyFromDayNumber(today), { ...at(keyFromDayNumber(today), tonightVenueId), venueId: tonightVenueId });
  return [...byKey.values()].sort((a, b) => b.key.localeCompare(a.key));
}

/** Takvim için ayın düzeni: ilk günün haftadaki yeri (Pazartesi = 0) ve gün sayısı. */
export function monthLayout(year: number, month: number): { offset: number; days: number } {
  const first = new Date(Date.UTC(year, month, 1));
  return { offset: (first.getUTCDay() + 6) % 7, days: new Date(Date.UTC(year, month + 1, 0)).getUTCDate() };
}

export function keyOf(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}
