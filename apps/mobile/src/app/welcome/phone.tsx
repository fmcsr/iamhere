import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassCard } from '@/components/glass';
import { ActionButton } from '@/components/native-controls';
import { Text, TextInput } from '@/components/text';
import { Gap, Type } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

const CODE_LENGTH = 6;

/** Türkiye cep numarası: 10 hane, "532 123 45 67" diye gruplanır. */
const formatPhone = (value: string) =>
  value
    .replace(/\D/g, '')
    .slice(0, 10)
    .replace(/^(\d{3})(\d{1,3})?(\d{1,2})?(\d{1,2})?$/, (_, a, b, c, d) => [a, b, c, d].filter(Boolean).join(' '));

/** Telefonla giriş: numara, sonra 6 haneli kod. Prototipte SMS gitmez; her kod geçerli. */
export default function SignIn() {
  const theme = useTheme();
  const t = useT().auth;
  const { signIn } = useApp();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const digits = phone.replace(/\D/g, '');
  const phoneOk = digits.length === 10;

  const input = [Type.title3, styles.input, { color: theme.text }];

  return (
    <View style={styles.page}>
      {step === 'phone' ? (
        <>
          <Text style={[Type.largeTitle, { color: theme.text }]}>{t.phoneTitle}</Text>
          <Text style={[Type.subheadline, { color: theme.textSecondary }]}>{t.phoneNote}</Text>
          <GlassCard style={styles.field}>
            <Text style={[Type.title3, { color: theme.textSecondary }]}>+90</Text>
            <TextInput
              value={phone}
              onChangeText={(value) => setPhone(formatPhone(value))}
              placeholder={t.phonePlaceholder}
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              autoFocus
              accessibilityLabel={t.phoneTitle}
              style={input}
            />
          </GlassCard>
          <ActionButton title={t.sendCode} onPress={() => setStep('code')} disabled={!phoneOk} fullWidth />
        </>
      ) : (
        <>
          <Text style={[Type.largeTitle, { color: theme.text }]}>{t.codeTitle}</Text>
          <Text style={[Type.subheadline, { color: theme.textSecondary }]}>{t.codeNote(`+90 ${phone}`)}</Text>
          <GlassCard style={styles.field}>
            <TextInput
              value={code}
              onChangeText={(value) => {
                const next = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
                setCode(next);
                // Altı hane tamamlanınca beklemeden girer (SMS'ten otomatik dolunca da).
                if (next.length === CODE_LENGTH) signIn();
              }}
              placeholder="••••••"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              autoFocus
              accessibilityLabel={t.codeTitle}
              style={[input, styles.code]}
            />
          </GlassCard>
          <ActionButton title={t.verify} onPress={signIn} disabled={code.length < CODE_LENGTH} fullWidth />
          <ActionButton title={t.changeNumber} variant="glass" size="regular" onPress={() => { setCode(''); setStep('phone'); }} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24, paddingTop: 120, gap: Gap.block, width: '100%', maxWidth: 520, alignSelf: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, marginVertical: 8 },
  input: { flex: 1, padding: 0 },
  code: { letterSpacing: 8 },
});
