import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/native-controls';
import { Text } from '@/components/text';
import { Gap, Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

/**
 * Hoş geldin (giriş öncesi): simge, ad, kısa tanıtım ve üç giriş yolu (K-09). Zemin marka gradyanı.
 * Apple ve Google prototipte doğrudan girer; telefon kod adımına gider (welcome/phone.tsx).
 */
export default function Welcome() {
  const theme = useTheme();
  const t = useT().auth;
  const { signIn } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.hero}>
        <Image source={require('@/assets/images/icon.png')} style={styles.icon} accessibilityIgnoresInvertColors />
        <Text style={[styles.name, { color: theme.text }]}>HERE</Text>
        <Text style={[Type.title3, styles.center, { color: theme.text }]}>{t.tagline}</Text>
        <Text style={[Type.subheadline, styles.center, { color: theme.textSecondary }]}>{t.pitch}</Text>
      </View>

      <View style={styles.actions}>
        {Platform.OS === 'ios' && (
          <ActionButton title={t.apple} systemImage="apple.logo" onPress={signIn} color={theme.text} labelColor={theme.background} fullWidth />
        )}
        <ActionButton title={t.google} variant="glass" onPress={signIn} fullWidth />
        <ActionButton title={t.phone} systemImage="phone" variant="glass" onPress={() => router.push('/welcome/phone')} fullWidth />
        <Text style={[Type.caption, styles.center, styles.terms, { color: theme.textSecondary }]}>{t.terms}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, width: '100%', maxWidth: 520, alignSelf: 'center' },
  hero: { alignItems: 'center', gap: Gap.block },
  icon: { width: 96, height: 96, borderRadius: 22, marginBottom: 4 },
  name: { fontSize: 44, fontWeight: '800', letterSpacing: 1 },
  center: { textAlign: 'center' },
  actions: { gap: Gap.block },
  terms: { marginTop: 4, paddingHorizontal: 12 },
});
