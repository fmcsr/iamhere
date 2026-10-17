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

/** Kullanıcı adı kuralları (Instagram'daki gibi): 3–24 karakter; harf, rakam, nokta, alt çizgi. */
export function usernameProblem(username: string, taken: boolean): string | undefined {
  if (username.length < 3) return 'En az 3 karakter olmalı.';
  if (username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
    return 'Nokta başta, sonda ya da art arda olamaz.';
  }
  if (taken) return 'Bu kullanıcı adı alınmış.';
  return undefined;
}
