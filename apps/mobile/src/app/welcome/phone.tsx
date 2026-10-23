import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { ActionButton } from '@/components/native-controls';
import { Text, TextInput } from '@/components/text';
import { Gap, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';
import { isMobile, phoneDigits } from '@/lib/phone';

/**
 * Telefonla giriş, 1. adım: numara. Alan kontrolsüz: yazılanı değiştirmeyiz, yoksa hızlı yazarken rakam kaçar.
 * Baştaki 0 ya da +90 kabul edilir (phoneDigits). Sonraki adım kod (welcome/code.tsx); geri gelince numara yerinde.
 */
export default function PhoneStep() {
  const theme = useTheme();
  const t = useT().auth;
  const [text, setText] = useState('');
  const digits = phoneDigits(text);
  const sendCode = () => router.push({ pathname: '/welcome/code', params: { phone: digits } });

  return (
    <View style={styles.page}>
      <Text style={[Type.largeTitle, { color: theme.text }]}>{t.phoneTitle}</Text>
      <Text style={[Type.subheadline, { color: theme.textSecondary }]}>{t.phoneNote}</Text>
      <GlassCard style={styles.field}>
        <Text style={[Type.title3, { color: theme.textSecondary }]}>+90</Text>
        <TextInput
          onChangeText={setText}
          maxLength={17}
          placeholder={t.phonePlaceholder}
          placeholderTextColor={theme.textSecondary}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoFocus
          accessibilityLabel={t.phoneTitle}
          style={[Type.title3, styles.input, { color: theme.text }]}
        />
      </GlassCard>
      <ActionButton title={t.sendCode} onPress={sendCode} disabled={!isMobile(digits)} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24, paddingTop: 120, gap: Gap.block, width: '100%', maxWidth: 520, alignSelf: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, marginVertical: 8 },
  input: { flex: 1, padding: 0 },
});
