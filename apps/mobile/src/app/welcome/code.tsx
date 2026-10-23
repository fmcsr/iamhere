import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { ActionButton } from '@/components/native-controls';
import { Text, TextInput } from '@/components/text';
import { Gap, Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';
import { formatPhone } from '@/lib/phone';

const CODE_LENGTH = 6;

/** Telefonla giriş, 2. adım: 6 haneli kod. Prototipte SMS gitmez, her kod geçerli; altı hane girilince kendiliğinden girer. */
export default function CodeStep() {
  const theme = useTheme();
  const t = useT().auth;
  const { signIn } = useApp();
  const params = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  // Otomatik doğrulama ile Doğrula düğmesi aynı anda tetiklenirse bir kez girilsin.
  const done = useRef(false);

  const verify = () => {
    if (done.current) return;
    done.current = true;
    signIn();
  };

  const onChangeText = (text: string) => {
    setCode(text);
    // Altı hane tamamlanınca beklemeden girer (SMS'ten otomatik dolunca da).
    if (text.replace(/\D/g, '').length === CODE_LENGTH) verify();
  };

  return (
    <View style={styles.page}>
      <Text style={[Type.largeTitle, { color: theme.text }]}>{t.codeTitle}</Text>
      <Text style={[Type.subheadline, { color: theme.textSecondary }]}>{t.codeNote(formatPhone(params.phone ?? ''))}</Text>
      <GlassCard style={styles.field}>
        <TextInput
          onChangeText={onChangeText}
          maxLength={CODE_LENGTH}
          placeholder="••••••"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus
          accessibilityLabel={t.codeTitle}
          style={[Type.title3, styles.input, styles.code, { color: theme.text }]}
        />
      </GlassCard>
      <ActionButton title={t.verify} onPress={verify} disabled={code.length < CODE_LENGTH} fullWidth />
      <ActionButton title={t.changeNumber} variant="glass" size="regular" onPress={() => router.back()} />
    </View>
  );
}

// Numara adımıyla (phone.tsx) aynı düzen.
const styles = StyleSheet.create({
  page: { flex: 1, padding: 24, paddingTop: 120, gap: Gap.block, width: '100%', maxWidth: 520, alignSelf: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, marginVertical: 8 },
  input: { flex: 1, padding: 0 },
  code: { letterSpacing: 8 },
});
