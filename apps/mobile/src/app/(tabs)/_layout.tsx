import { NativeTabs } from 'expo-router/native-tabs';

import { NowHereAccessory } from '@/components/now-here-accessory';
import { Fonts } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

/**
 * Yerel sekme çubuğu: iOS 26+ Liquid Glass'ı sistem çizer. Akışta aşağı kaydırınca küçülür.
 * Seçili sekme fuşya (T-2). "Buradayım" yerel bir sekme (T-1); iOS 27'de "öne çıkan sekme"
 * olarak kendi cam yüzeyine ayrılır ve çubuk küçüldüğünde de görünür kalır
 * (UITabBarController.prominentTabIdentifier). Yer bildirmişken çubuğun üstünde cam aksesuar görünür.
 * `sidebarAdaptable`: iPad'de ve iPhone Duo'nun iç ekranında sekmeler kenar çubuğuna da dönüşebilir.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const t = useT().tabs;
  const { checkIn, conversations, isUnread } = useApp();
  // Bekleyen istek ya da okunmamış birebir sohbet varsa Mesajlar'ın sağ altında küçücük kırmızı nokta (Instagram'daki gibi).
  // Mekân sohbetleri sayılmaz: kalabalık bir mekânda nokta hiç sönmezdi.
  const news = conversations.some((c) => c.kind === 'direct' && (c.status === 'request' || isUnread(c.id)));

  return (
    <NativeTabs
      tintColor={theme.accentInk}
      labelStyle={{ fontFamily: Fonts.medium }}
      minimizeBehavior="onScrollDown"
      sidebarAdaptable
      unstable_nativeProps={{ ios: { prominentScreenKey: 'checkin', tabBarSidebarPreferredPlacement: 'sidebar' } }}>
      {checkIn && (
        <NativeTabs.BottomAccessory>
          <NowHereAccessory />
        </NativeTabs.BottomAccessory>
      )}
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>{t.home}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>{t.explore}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="checkin">
        <NativeTabs.Trigger.Label>{t.checkin}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'mappin.and.ellipse', selected: 'mappin.and.ellipse' }} md="add_location" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Label>{t.messages}</NativeTabs.Trigger.Label>
        {/* Sistemin rozeti simgenin sağ üstüne çıkıp seçili Profil sekmesinin camına taşıyordu; nokta simgenin içinde.
            Asset kataloğundan (scripts/generate-tab-icons.swift, plugins/with-xcassets.js): nokta kırmızı, simge açık
            modda siyah, koyu modda beyaz. Seçiliyken iOS simgeyi fuşyaya boyar. */}
        {news ? (
          <NativeTabs.Trigger.Icon xcasset={{ default: 'tab-messages-dot', selected: 'tab-messages-dot-selected' }} md="forum" />
        ) : (
          <NativeTabs.Trigger.Icon
            sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
            md="forum"
          />
        )}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t.profile}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
