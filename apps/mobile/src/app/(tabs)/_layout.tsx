import { NativeTabs } from 'expo-router/native-tabs';

import { NowHereAccessory } from '@/components/now-here-accessory';
import { Fonts } from '@/constants/theme';
import { useApp } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';

/**
 * Yerel sekme çubuğu: iOS 26+ Liquid Glass'ı sistem çizer. Akışta aşağı kaydırınca küçülür.
 * Seçili sekme fuşya (T-2). "Buradayım" yerel bir sekme (T-1); iOS 27'de "öne çıkan sekme"
 * olarak kendi cam yüzeyine ayrılır ve çubuk küçüldüğünde de görünür kalır
 * (UITabBarController.prominentTabIdentifier). Yer bildirmişken çubuğun üstünde cam aksesuar görünür.
 * `sidebarAdaptable={false}`: geniş ekranlarda (iPad, iPhone Duo iç ekranı) da sekme çubuğu kalır.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const { checkIn } = useApp();

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
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }}
          md="forum"
        />
        {/* İstek rozeti şimdilik yok: seçili sekmenin camıyla çakışıyordu, başka bir çözüm aranacak. İstekler Mesajlar içinde. */}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
