import { Button, Form, Group, Host, Picker, RNHostView, Section, Text, Toggle } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  labelsHidden,
  listRowBackground,
  pickerStyle,
  scrollContentBackground,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { Alert, PlatformColor } from 'react-native';

import { AppearancePreviews } from '@/components/appearance-previews';
import { NativeFonts, type BackdropVariant } from '@/constants/theme';
import { type AppearanceMode, type AppearanceUI, type PresenceVisibility, useApp } from '@/data/store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import type { LanguageSetting } from '@/i18n';
import { useT } from '@/i18n/use-t';
import { editProfile } from '@/lib/profile';

const BACKDROPS: BackdropVariant[] = ['ust', 'kose', 'genis'];
const APPEARANCE_UIS: AppearanceUI[] = ['onizleme', 'ios', 'menu'];
const LANGUAGES: LanguageSetting[] = ['system', 'tr', 'en'];

// DM Sans (T-16). textStyle sayesinde yazılar Dynamic Type ile büyür.
const BODY = font({ family: NativeFonts.regular, size: 17, textStyle: 'body' });
const HEADER = font({ family: NativeFonts.semibold, size: 17, textStyle: 'headline' });
const FOOTNOTE = font({ family: NativeFonts.regular, size: 13, textStyle: 'footnote' });

const header = (title: string) => <Text modifiers={[HEADER]}>{title}</Text>;
const footer = (note: string) => <Text modifiers={[FOOTNOTE]}>{note}</Text>;

/**
 * Yerel iOS ayar listesi: gruplu satırlar, sistem yeşili anahtar (T-3), seçili seçenekte onay işareti.
 * Zemin marka gradyanı (T-11). "Tasarım denemesi" bölümü geçici: görünüm alanının üç seçeneği (T-19)
 * ve zemin varyantları (T-18) kurucuyla karşılaştırılıp karar verilince kalkacak. Dil: Sistem / Türkçe / English (T-29).
 */
export function SettingsForm() {
  const theme = useTheme();
  const t = useT().settings;
  const { settings, updateSettings, setAppearance, setLanguage, trial, setTrial } = useApp();
  const soon = (title: string) => Alert.alert(title, t.safety.empty);
  // Satırlar yarı saydam dolgu: beyaz zeminde kaybolmaz, gradyanın rengini alır.
  const row = listRowBackground(theme.fill);
  // Menü değerleri metin renginde: cam üstünde küçük fuşya metin yok (§2.3 kural 5).
  const menu = [pickerStyle('menu'), tint(theme.text), BODY, row];

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      {/* Onay işaretleri fuşya (§3.4); anahtar ise sistem yeşilinde kalır (T-3). Zemin şeffaf: marka gradyanı görünür. */}
      <Form modifiers={[scrollContentBackground('hidden'), tint(theme.accentInk)]}>
        <Section header={header(t.account)}>
          <Button label={t.editProfile} systemImage="pencil" onPress={editProfile} modifiers={[foregroundStyle(theme.text), BODY, row]} />
        </Section>

        <Section header={header(t.trial.title)} footer={footer(t.trial.note)}>
          <Picker<string>
            label={t.trial.appearanceUI}
            selection={trial.appearanceUI}
            onSelectionChange={(value) => setTrial({ appearanceUI: value as AppearanceUI })}
            modifiers={menu}>
            {APPEARANCE_UIS.map((key) => (
              <Text key={key} modifiers={[tag(key), BODY]}>
                {t.trial.appearanceUILabel[key]}
              </Text>
            ))}
          </Picker>
          <Picker<string>
            label={t.trial.backdrop}
            selection={trial.backdrop}
            onSelectionChange={(value) => setTrial({ backdrop: value as BackdropVariant })}
            modifiers={menu}>
            {BACKDROPS.map((key) => (
              <Text key={key} modifiers={[tag(key), BODY]}>
                {t.trial.backdropLabel[key]}
              </Text>
            ))}
          </Picker>
        </Section>

        <AppearanceSection ui={trial.appearanceUI} variant={trial.backdrop} mode={settings.appearance} onChange={setAppearance} />

        <Section header={header(t.language.title)} footer={footer(t.language.note)}>
          <Picker<string>
            label={t.language.title}
            selection={settings.language}
            onSelectionChange={(value) => setLanguage(value as LanguageSetting)}
            modifiers={menu}>
            {LANGUAGES.map((key) => (
              <Text key={key} modifiers={[tag(key), BODY]}>
                {t.language.option[key]}
              </Text>
            ))}
          </Picker>
        </Section>

        <Section header={header(t.privacy.title)} footer={footer(t.privacy.privateNote)}>
          <Toggle
            label={t.privacy.privateAccount}
            isOn={settings.privateAccount}
            onIsOnChange={(value) => updateSettings({ privateAccount: value })}
            modifiers={[tint(PlatformColor('systemGreen')), BODY, row]}
          />
        </Section>

        <Section header={header(t.presence.title)} footer={footer(t.presence.note[settings.presenceVisibility])}>
          <Picker<string>
            label={t.presence.label}
            selection={settings.presenceVisibility}
            onSelectionChange={(value) => updateSettings({ presenceVisibility: value as PresenceVisibility })}
            modifiers={[pickerStyle('inline'), labelsHidden(), row]}>
            <Text modifiers={[tag('herkes'), BODY, row]}>{t.presence.option.herkes}</Text>
            <Text modifiers={[tag('karsilikli'), BODY, row]}>{t.presence.option.karsilikli}</Text>
            <Text modifiers={[tag('kimse'), BODY, row]}>{t.presence.option.kimse}</Text>
          </Picker>
        </Section>

        <Section header={header(t.safety.title)} footer={footer(t.safety.footer)}>
          <Button
            label={t.safety.blocked}
            systemImage="hand.raised"
            onPress={() => soon(t.safety.blocked)}
            modifiers={[foregroundStyle(theme.text), BODY, row]}
          />
          <Button
            label={t.safety.muted}
            systemImage="speaker.slash"
            onPress={() => soon(t.safety.muted)}
            modifiers={[foregroundStyle(theme.text), BODY, row]}
          />
        </Section>
      </Form>
    </Host>
  );
}

/**
 * Görünüm alanının üç seçeneği (T-19):
 * 1. Önizlemeli kartlar: Sistem / Açık / Koyu mini ekranları, altında onay dairesi.
 * 2. iOS gibi: Açık / Koyu önizlemeleri + "Otomatik" anahtarı (iOS Ekran ve Parlaklık).
 * 3. Menü: tek satır, dokununca açılan seçici.
 */
function AppearanceSection({
  ui,
  variant,
  mode,
  onChange,
}: {
  ui: AppearanceUI;
  variant: BackdropVariant;
  mode: AppearanceMode;
  onChange: (mode: AppearanceMode) => void;
}) {
  const theme = useTheme();
  const t = useT().settings.appearance;
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const row = listRowBackground(theme.fill);

  if (ui === 'menu') {
    return (
      <Section header={header(t.title)} footer={footer(t.note[mode])}>
        <Picker<string>
          label={t.title}
          selection={mode}
          onSelectionChange={(value) => onChange(value as AppearanceMode)}
          modifiers={[pickerStyle('menu'), tint(theme.text), BODY, row]}>
          <Text modifiers={[tag('system'), BODY]}>{t.mode.system}</Text>
          <Text modifiers={[tag('light'), BODY]}>{t.mode.light}</Text>
          <Text modifiers={[tag('dark'), BODY]}>{t.mode.dark}</Text>
        </Picker>
      </Section>
    );
  }

  const automatic = mode === 'system';
  return (
    <Section
      header={header(t.title)}
      footer={footer(ui === 'ios' ? t.automaticNote : t.note[mode])}>
      {/* RN önizlemeleri SwiftUI satırına gömülü; Group satırın yarı saydam zeminini taşır. */}
      <Group modifiers={[row]}>
        <RNHostView matchContents={{ vertical: true }}>
          <AppearancePreviews
            modes={ui === 'ios' ? ['light', 'dark'] : ['system', 'light', 'dark']}
            // iOS seçeneğinde Otomatik açıksa o anki görünüm işaretli; bir önizlemeye dokunmak Otomatik'i kapatır.
            selected={ui === 'ios' && automatic ? scheme : mode}
            onSelect={onChange}
            variant={variant}
          />
        </RNHostView>
      </Group>
      {ui === 'ios' ? (
        <Toggle
          label={t.automatic}
          isOn={automatic}
          onIsOnChange={(on) => onChange(on ? 'system' : scheme)}
          modifiers={[tint(PlatformColor('systemGreen')), BODY, row]}
        />
      ) : null}
    </Section>
  );
}
