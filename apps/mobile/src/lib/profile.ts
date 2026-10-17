import { Directory, File, Paths } from 'expo-file-system';
import { router } from 'expo-router';

/** Profili düzenle: profil kapağındaki kalem ve Ayarlar › Hesap. */
export const editProfile = () => router.push('/edit-profile');

const PHOTO_DIR = 'profile';
const DOC_PREFIX = 'doc:';

/** Seçilen fotoğrafı uygulamanın belgeler klasörüne kopyalar: seçicinin önbelleği zamanla silinir. */
export async function keepPhoto(uri: string, name: 'avatar' | 'cover'): Promise<string> {
  if (!uri.startsWith('file://') || uri.startsWith(Paths.document.uri)) return uri;
  const dir = new Directory(Paths.document, PHOTO_DIR);
  dir.create({ intermediates: true, idempotent: true });
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const file = new File(dir, `${name}-${Date.now()}.${ext}`);
  await new File(uri).copy(file);
  return file.uri;
}

/** Artık kullanılmayan eski profil fotoğrafını siler. */
export function dropPhoto(uri?: string) {
  if (!uri?.startsWith(Paths.document.uri)) return;
  try {
    new File(uri).delete();
  } catch {
    // Zaten yoksa sorun değil.
  }
}

/** Saklarken belgeler klasöründeki dosyalar göreli yazılır: uygulama güncellenince klasörün yolu değişebilir. */
export const storedPhoto = (uri?: string) =>
  uri?.startsWith(Paths.document.uri) ? DOC_PREFIX + uri.slice(Paths.document.uri.length) : uri;

export const loadedPhoto = (value?: string) =>
  value?.startsWith(DOC_PREFIX) ? new File(Paths.document, value.slice(DOC_PREFIX.length)).uri : value;
