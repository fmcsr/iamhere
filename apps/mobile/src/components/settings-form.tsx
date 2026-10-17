// Android ve web için ayar listesi. iOS sürümü: settings-form.ios.tsx (SwiftUI Form).
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppearancePreviews } from '@/components/appearance-previews';
import { GlassCard } from '@/components/glass';
import { SegmentedPicker } from '@/components/native-controls';
import { APPEARANCE_NOTE, PRESENCE_NOTE } from '@/components/settings-form.shared';
import { Text } from '@/components/text';
import { Type, type BackdropVariant } from '@/constants/theme';
import { type PresenceVisibility, useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { editProfile } from '@/lib/profile';

export function SettingsForm() {
  const theme = useTheme();
  const { settings, updateSettings, setAppearance, trial, setTrial } = useApp();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>HESAP</Text>
      <GlassCard style={styles.group}>
        <Pressable onPress={editProfile} accessibilityRole="button" style={styles.row}>
          <Text style={[Type.body, { color: theme.text, flex: 1 }]}>Profili düzenle</Text>
        </Pressable>
      </GlassCard>

      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>TASARIM DENEMESİ · ZEMİN</Text>
      <GlassCard style={styles.group}>
        <SegmentedPicker<BackdropVariant>
          options={[
            { value: 'ust', label: 'A · Üst' },
            { value: 'kose', label: 'B · Köşe' },
            { value: 'genis', label: 'C · Geniş' },
          ]}
          value={trial.backdrop}
          onChange={(backdrop) => setTrial({ backdrop })}
          accessibilityLabel="Zemin denemesi"
        />
      </GlassCard>
      <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>
        Geçici: seçenekleri karşılaştırmak için. Karar verilince bu bölüm kalkacak.
      </Text>

      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>GÖRÜNÜM</Text>
      <GlassCard style={styles.group}>
        <AppearancePreviews
          modes={['system', 'light', 'dark']}
          selected={settings.appearance}
          onSelect={setAppearance}
          variant={trial.backdrop}
        />
      </GlassCard>
      <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>{APPEARANCE_NOTE[settings.appearance]}</Text>

      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>GİZLİLİK</Text>
      <GlassCard style={styles.group}>
        <View style={styles.row}>
          <Text style={[Type.body, { color: theme.text, flex: 1 }]}>Gizli hesap</Text>
          <Switch
            value={settings.privateAccount}
            onValueChange={(value) => updateSettings({ privateAccount: value })}
            accessibilityLabel="Gizli hesap"
          />
        </View>
      </GlassCard>
      <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>
        Gizli hesapta paylaşımlarını yalnızca onayladığın takipçiler görür.
      </Text>

      <Text style={[Type.footnote, styles.section, { color: theme.textSecondary }]}>ŞU AN BURADA KİMLER GÖRSÜN</Text>
      <GlassCard style={styles.group}>
        <SegmentedPicker<PresenceVisibility>
          options={[
            { value: 'herkes', label: 'Herkes' },
            { value: 'karsilikli', label: 'Karşılıklı' },
            { value: 'kimse', label: 'Kimse' },
          ]}
          value={settings.presenceVisibility}
          onChange={(value) => updateSettings({ presenceVisibility: value })}
          accessibilityLabel="Şu an burada kimler görsün"
        />
      </GlassCard>
      <Text style={[Type.footnote, styles.footer, { color: theme.textSecondary }]}>{PRESENCE_NOTE[settings.presenceVisibility]}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 16, gap: 6 },
  section: { marginLeft: 16, marginTop: 12 },
  group: { borderRadius: 14, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 },
  footer: { marginHorizontal: 16 },
});
