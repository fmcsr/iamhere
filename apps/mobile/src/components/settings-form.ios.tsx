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
import { APPEARANCE_NOTE, APPEARANCE_UI_LABEL, BACKDROP_LABEL, PRESENCE_NOTE } from '@/components/settings-form.shared';
import { NativeFonts, type BackdropVariant } from '@/constants/theme';
import { type AppearanceMode, type AppearanceUI, type PresenceVisibility, useApp } from '@/data/store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

// DM Sans (T-16). textStyle sayesinde yazılar Dynamic Type ile büyür.
const BODY = font({ family: NativeFonts.regular, size: 17, textStyle: 'body' });
const HEADER = font({ family: NativeFonts.semibold, size: 17, textStyle: 'headline' });
const FOOTNOTE = font({ family: NativeFonts.regular, size: 13, textStyle: 'footnote' });

const header = (title: string) => <Text modifiers={[HEADER]}>{title}</Text>;
const footer = (note: string) => <Text modifiers={[FOOTNOTE]}>{note}</Text>;

/**
 * Yerel iOS ayar listesi: gruplu satırlar, sistem yeşili anahtar (T-3), seçili seçenekte onay işareti.
 * Zemin marka gradyanı (T-11). "Tasarım denemesi" bölümü geçici: görünüm alanının üç seçeneği (T-19)
 * ve zemin varyantları (T-18) kurucuyla karşılaştırılıp karar verilince kalkacak.
 */
export function SettingsForm() {
  const theme = useTheme();
  const { settings, updateSettings, setAppearance, trial, setTrial } = useApp();
  const soon = (title: string) => Alert.alert(title, 'Henüz kimse yok.');
  // Satırlar yarı saydam dolgu: beyaz zeminde kaybolmaz, gradyanın rengini alır.
  const row = listRowBackground(theme.fill);
  // Menü değerleri metin renginde: cam üstünde küçük fuşya metin yok (§2.3 kural 5).
  const menu = [pickerStyle('menu'), tint(theme.text), BODY, row];

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      {/* Onay işaretleri fuşya (§3.4); anahtar ise sistem yeşilinde kalır (T-3). Zemin şeffaf: marka gradyanı görünür. */}
      <Form modifiers={[scrollContentBackground('hidden'), tint(theme.accentInk)]}>
        <Section
          header={header('Tasarım denemesi')}
          footer={footer('Geçici: seçenekleri karşılaştırmak için. Karar verilince bu bölüm kalkacak.')}>
          <Picker<string>
            label="Görünüm alanı"
            selection={trial.appearanceUI}
            onSelectionChange={(value) => setTrial({ appearanceUI: value as AppearanceUI })}
            modifiers={menu}>
            {(Object.keys(APPEARANCE_UI_LABEL) as AppearanceUI[]).map((key) => (
              <Text key={key} modifiers={[tag(key), BODY]}>
                {APPEARANCE_UI_LABEL[key]}
              </Text>
            ))}
          </Picker>
          <Picker<string>
            label="Zemin"
            selection={trial.backdrop}
            onSelectionChange={(value) => setTrial({ backdrop: value as BackdropVariant })}
            modifiers={menu}>
            {(Object.keys(BACKDROP_LABEL) as BackdropVariant[]).map((key) => (
              <Text key={key} modifiers={[tag(key), BODY]}>
                {BACKDROP_LABEL[key]}
              </Text>
            ))}
          </Picker>
        </Section>

        <AppearanceSection ui={trial.appearanceUI} variant={trial.backdrop} mode={settings.appearance} onChange={setAppearance} />

        <Section
          header={header('Gizlilik')}
          footer={footer('Gizli hesapta paylaşımlarını yalnızca onayladığın takipçiler görür.')}>
          <Toggle
            label="Gizli hesap"
            isOn={settings.privateAccount}
            onIsOnChange={(value) => updateSettings({ privateAccount: value })}
            modifiers={[tint(PlatformColor('systemGreen')), BODY, row]}
          />
        </Section>

        <Section header={header('Şu an burada kimler görsün')} footer={footer(PRESENCE_NOTE[settings.presenceVisibility])}>
          <Picker<string>
            label="Şu an burada"
            selection={settings.presenceVisibility}
            onSelectionChange={(value) => updateSettings({ presenceVisibility: value as PresenceVisibility })}
            modifiers={[pickerStyle('inline'), labelsHidden(), row]}>
            <Text modifiers={[tag('herkes'), BODY, row]}>Herkes</Text>
            <Text modifiers={[tag('karsilikli'), BODY, row]}>Karşılıklı takipleştiklerim</Text>
            <Text modifiers={[tag('kimse'), BODY, row]}>Kimse</Text>
          </Picker>
        </Section>

        <Section header={header('Güvenlik')} footer={footer('I am Here · prototip · #iamhere')}>
          <Button
            label="Engellenenler"
            systemImage="hand.raised"
            onPress={() => soon('Engellenenler')}
            modifiers={[foregroundStyle(theme.text), BODY, row]}
          />
          <Button
            label="Sessize alınanlar"
            systemImage="speaker.slash"
            onPress={() => soon('Sessize alınanlar')}
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
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const row = listRowBackground(theme.fill);

  if (ui === 'menu') {
    return (
      <Section header={header('Görünüm')} footer={footer(APPEARANCE_NOTE[mode])}>
        <Picker<string>
          label="Görünüm"
          selection={mode}
          onSelectionChange={(value) => onChange(value as AppearanceMode)}
          modifiers={[pickerStyle('menu'), tint(theme.text), BODY, row]}>
          <Text modifiers={[tag('system'), BODY]}>Sistem</Text>
          <Text modifiers={[tag('light'), BODY]}>Açık</Text>
          <Text modifiers={[tag('dark'), BODY]}>Koyu</Text>
        </Picker>
      </Section>
    );
  }

  const automatic = mode === 'system';
  return (
    <Section
      header={header('Görünüm')}
      footer={footer(ui === 'ios' ? 'Otomatik açıkken iPhone’un açık/koyu ayarını izler.' : APPEARANCE_NOTE[mode])}>
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
          label="Otomatik"
          isOn={automatic}
          onIsOnChange={(on) => onChange(on ? 'system' : scheme)}
          modifiers={[tint(PlatformColor('systemGreen')), BODY, row]}
        />
      ) : null}
    </Section>
  );
}
