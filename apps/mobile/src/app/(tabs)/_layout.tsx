import { NativeTabs } from 'expo-router/native-tabs';

import { NowHereAccessory } from '@/components/now-here-accessory';
import { Fonts } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

/** Mesajlar simgesi, sağ alt köşesinde küçücük noktayla (scripts/generate-tab-icons.swift üretir). */
const MESSAGES_DOT = {
  default: require('@/assets/images/tabIcons/messages-dot.png'),
  selected: require('@/assets/images/tabIcons/messages-dot-fill.png'),
};

/**
 * Yerel sekme çubuğu: iOS 26+ Liquid Glass'ı sistem çizer. Akışta aşağı kaydırınca küçülür.
 * Seçili sekme fuşya (T-2). "Buradayım" yerel bir sekme (T-1); iOS 27'de "öne çıkan sekme"
 * olarak kendi cam yüzeyine ayrılır ve çubuk küçüldüğünde de görünür kalır
 * (UITabBarController.prominentTabIdentifier). Yer bildirmişken çubuğun üstünde cam aksesuar görünür.
 * `sidebarAdaptable`: iPad'de ve iPhone Duo'nun iç ekranında sekmeler kenar çubuğuna da dönüşebilir.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const { checkIn, conversations, isUnread } = useApp();
  // Bekleyen istek ya da okunmamış birebir sohbet varsa Mesajlar'ın altında küçücük nokta (Instagram'daki gibi).
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
        <NativeTabs.Trigger.Label>Ana Sayfa</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Keşfet</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="checkin">
        <NativeTabs.Trigger.Label>Buradayım</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'mappin.and.ellipse', selected: 'mappin.and.ellipse' }} md="add_location" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Label>Mesajlar</NativeTabs.Trigger.Label>
        {/* Sistemin rozeti simgenin sağ üstüne çıkıp seçili Profil sekmesinin camına taşıyordu; nokta simgenin içinde.
            Şablon olarak boyanır: cam açığa ya da koyuya döndüğünde nokta da simgeyle birlikte döner. */}
        {news ? (
          <NativeTabs.Trigger.Icon src={MESSAGES_DOT} renderingMode="template" md="forum" />
        ) : (
          <NativeTabs.Trigger.Icon
            sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
            md="forum"
          />
        )}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
