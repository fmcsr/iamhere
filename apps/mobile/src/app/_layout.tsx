import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { isRunningInExpoGo } from 'expo';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

import { Colors, HeaderFonts } from '@/constants/theme';
import { AppProvider, useApp } from '@/data/store';
import { useBackdrop } from '@/hooks/use-backdrop';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { STRINGS } from '@/i18n';

// Yazılar (DM Sans) yüklenene ve kayıtlı görünüm (açık/koyu) ekrana yansıyana kadar açılış ekranı
// kalır: telefon açık modda olsa da "Koyu" seçen kullanıcı açılışta beyaz flaş görmez.
// Kalkarken yumuşakça solar (Expo Go desteklemez).
SplashScreen.preventAutoHideAsync();
if (!isRunningInExpoGo()) SplashScreen.setOptions({ duration: 250, fade: true });

// React Native'in bilinen, zararsız geliştirme uyarısı (yerel sekme/başlık animasyonlarından);
// simülatörde sekme çubuğunun üstünü kapatmasın.
LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners registered.']);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });
  // Yazı yüklenmeden çizilirse önce sistem yazısı görünür; bu sürede açılış ekranı kalır.
  if (!fontsLoaded && !fontError) return null;

  return (
    <AppProvider>
      <RootStack />
    </AppProvider>
  );
}

function RootStack() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const backdrop = useBackdrop();
  const { settings, appearanceLoaded, lang } = useApp();
  const title = STRINGS[lang].titles;
  const ready = appearanceLoaded && (settings.appearance === 'system' || settings.appearance === scheme);

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  const theme = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  // Başlık düğmeleri metin renginde (fuşya değil); zemin uygulamanın kendi rengi (beyaz parlama olmasın).
  const navigationTheme = {
    ...base,
    colors: { ...base.colors, primary: theme.text, background: theme.background, card: theme.surface, text: theme.text, border: theme.separator },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      {/* Her ekranın zemini marka gradyanı; ekran kendi zeminini taşıdığı için geçişlerde üst üste binme olmaz. */}
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', contentStyle: backdrop, ...HeaderFonts }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="venue/[id]" options={{ title: '' }} />
        <Stack.Screen name="chat/[id]" options={{ title: title.chat }} />
        {/* Profil kapağı ekranın en üstünden başlar; geri ve ••• düğmeleri kapağın üstünde (kendi profilin gibi). */}
        <Stack.Screen name="user/[username]" options={{ headerShown: false }} />
        <Stack.Screen name="compose" options={{ presentation: 'modal', title: title.compose }} />
        {/* Yer bildirme sayfası (T-26): ekranın üstünde saydam katman; sayfa alttan kendi animasyonuyla kayar. */}
        <Stack.Screen
          name="check-in/[venueId]"
          options={{ presentation: 'transparentModal', animation: 'none', headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
        />
        {/* Yarım yükseklikte cam sayfa: zemin şeffaf kalır ki iOS 26+ camı görünsün. */}
        <Stack.Screen
          name="people/[venueId]"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.5, 1],
            sheetGrabberVisible: true,
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="settings" options={{ title: title.settings }} />
        {/* Alttan açılan sayfa; üstte arkadaki profil görünür. İçerik kendi içinde kaymaz (edit-profile.tsx). */}
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal', title: title.editProfile }} />
        <Stack.Screen name="new-message" options={{ title: title.newMessage }} />
        <Stack.Screen name="follows" options={{ title: '' }} />
        <Stack.Screen name="posts" options={{ title: title.posts }} />
        <Stack.Screen name="nights" options={{ title: title.memories }} />
      </Stack>
    </ThemeProvider>
  );
}
