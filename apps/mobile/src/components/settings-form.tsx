// Android ve web için ayar listesi. iOS sürümü: settings-form.ios.tsx (SwiftUI Form).
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppearancePreviews } from '@/components/appearance-previews';
import { GlassCard } from '@/components/glass';
import { ActionButton, SegmentedPicker } from '@/components/native-controls';
import { Text } from '@/components/text';
import { Type, type BackdropVariant } from '@/constants/theme';
import { type PresenceVisibility, useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import type { LanguageSetting } from '@/i18n';
import { useT } from '@/i18n/use-t';
import { editProfile } from '@/lib/profile';
import { confirmSignOut } from '@/lib/session';

export function SettingsForm() {
  const theme = useTheme();
  const strings = useT();
  const t = strings.settings;
  const { settings, updateSettings, setAppearance, setLanguage, trial, setTrial, signOut } = useApp();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>{t.account.toLocaleUpperCase()}</Text>
      <GlassCard style={styles.group}>
        <Pressable onPress={editProfile} accessibilityRole="button" style={styles.row}>
          <Text style={[Type.body, { color: theme.text, flex: 1 }]}>{t.editProfile}</Text>
        </Pressable>
      </GlassCard>

      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>
        {`${t.trial.title} · ${t.trial.backdrop}`.toLocaleUpperCase()}
      </Text>
      <GlassCard style={styles.group}>
        <SegmentedPicker<BackdropVariant>
          options={(['ust', 'kose', 'genis'] as const).map((value) => ({ value, label: t.trial.backdropShort[value] }))}
          value={trial.backdrop}
          onChange={(backdrop) => setTrial({ backdrop })}
          accessibilityLabel={t.trial.backdrop}
        />
      </GlassCard>
      <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>{t.trial.note}</Text>

      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>{t.appearance.title.toLocaleUpperCase()}</Text>
      <GlassCard style={styles.group}>
        <AppearancePreviews
          modes={['system', 'light', 'dark']}
          selected={settings.appearance}
          onSelect={setAppearance}
          variant={trial.backdrop}
        />
      </GlassCard>
      <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>{t.appearance.note[settings.appearance]}</Text>

      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>{t.language.title.toLocaleUpperCase()}</Text>
      <GlassCard style={styles.group}>
        <SegmentedPicker<LanguageSetting>
          options={(['system', 'tr', 'en'] as const).map((value) => ({ value, label: t.language.option[value] }))}
          value={settings.language}
          onChange={setLanguage}
          accessibilityLabel={t.language.title}
        />
      </GlassCard>
      <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>{t.language.note}</Text>

      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>{t.privacy.title.toLocaleUpperCase()}</Text>
      <GlassCard style={styles.group}>
        <View style={styles.row}>
          <Text style={[Type.body, { color: theme.text, flex: 1 }]}>{t.privacy.privateAccount}</Text>
          <Switch
            value={settings.privateAccount}
            onValueChange={(value) => updateSettings({ privateAccount: value })}
            accessibilityLabel={t.privacy.privateAccount}
          />
        </View>
      </GlassCard>
      <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>{t.privacy.privateNote}</Text>

      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>{t.presence.title.toLocaleUpperCase()}</Text>
      <GlassCard style={styles.group}>
        <SegmentedPicker<PresenceVisibility>
          options={(['herkes', 'karsilikli', 'kimse'] as const).map((value) => ({ value, label: t.presence.optionShort[value] }))}
          value={settings.presenceVisibility}
          onChange={(value) => updateSettings({ presenceVisibility: value })}
          accessibilityLabel={t.presence.title}
        />
      </GlassCard>
      <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>{t.presence.note[settings.presenceVisibility]}</Text>

      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>{t.safety.title.toLocaleUpperCase()}</Text>
      <GlassCard style={styles.group}>
        {[
          { label: t.safety.report, onPress: () => router.push({ pathname: '/report', params: { kind: 'other' } }) },
          { label: t.safety.blocked, onPress: () => router.push('/blocked') },
          { label: t.safety.muted, onPress: () => router.push({ pathname: '/blocked', params: { list: 'muted' } }) },
        ].map(({ label, onPress }) => (
          <Pressable key={label} onPress={onPress} accessibilityRole="button" style={styles.row}>
            <Text style={[Type.body, { color: theme.text, flex: 1 }]}>{label}</Text>
          </Pressable>
        ))}
      </GlassCard>
      <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>{t.safety.footer}</Text>

      <ActionButton
        title={t.signOut.button}
        variant="tonal"
        destructive
        fullWidth
        onPress={() => confirmSignOut(strings, signOut)}
        style={styles.signOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 16, gap: 6 },
  section: { marginLeft: 16, marginTop: 12 },
  group: { borderRadius: 14, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 },
  footer: { marginHorizontal: 16 },
  signOut: { marginTop: 24 },
});
