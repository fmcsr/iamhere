import { Alert } from 'react-native';

import type { Strings } from '@/i18n';

/** Ayarlar › Çıkış yap onayı: yanlışlıkla dokunulursa hoş geldin sayfasına atmasın. */
export function confirmSignOut(t: Strings, signOut: () => void) {
  Alert.alert(t.settings.signOut.confirm, t.settings.signOut.note, [
    { text: t.actions.cancel, style: 'cancel' },
    { text: t.settings.signOut.button, style: 'destructive', onPress: signOut },
  ]);
}
