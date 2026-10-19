/** Profil alanlarının kuralları (Profili düzenle). */
export const NAME_MAX = 30;
export const BIO_MAX = 150;
export const USERNAME_MAX = 24;

/** Kullanıcı adı yazılırken: küçük harf, Türkçe harfler sadeleşir (ı → i), izin verilmeyenler düşer. */
export function cleanUsername(text: string): string {
  const plain: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return text
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (ch) => plain[ch])
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, USERNAME_MAX);
}

/** Kullanıcı adındaki sorun; metni sözlükteki `profile.edit.usernameProblem` verir (dosya React Native'siz denenebilsin diye). */
export type UsernameProblem = 'short' | 'dots' | 'taken';

/** Kullanıcı adı kuralları (Instagram'daki gibi): 3–24 karakter; harf, rakam, nokta, alt çizgi. */
export function usernameProblem(username: string, taken: boolean): UsernameProblem | undefined {
  if (username.length < 3) return 'short';
  if (username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
    return 'dots';
  }
  if (taken) return 'taken';
  return undefined;
}
