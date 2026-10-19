import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { ME_LOCATION, type Venue } from '@/data/mock';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n/use-t';

export type VenueMapProps = {
  venues: Venue[];
  selectedId?: string;
  /** Verilmezse pine dokununca mekân sayfası açılır. */
  onSelect?: (venueId: string) => void;
  style?: StyleProp<ViewStyle>;
  /** Yer bildirme yarıçapı (m): kullanıcının çevresinde daire çizer. */
  radius?: number;
  /** Kullanıcının (sahte) konumunu göster. */
  showMe?: boolean;
  /** Küçük önizleme haritalarında kaydırma/yakınlaştırma kapalı. */
  interactive?: boolean;
  zoom?: number;
  /** Haritayı gezdikten sonra konuma dönmek için köşede cam düğme. */
  recenter?: boolean;
};

// Prototipte iOS'ta Apple Haritalar kullanılır. Google Places verisi geldiğinde (K-05)
// Google sağlayıcısına geçilecek.
export function VenueMap({ venues, selectedId, onSelect, style, radius, showMe, interactive = true, zoom = 0.018, recenter }: VenueMapProps) {
  const theme = useTheme();
  const t = useT();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const center = showMe ? ME_LOCATION : { latitude: 40.988, longitude: 29.027 };
  const region = { ...center, latitudeDelta: zoom, longitudeDelta: zoom };
  const mapRef = useRef<MapView>(null);

  const map = (
    <MapView
      ref={mapRef}
      style={recenter ? StyleSheet.absoluteFill : (style ?? { flex: 1 })}
      initialRegion={region}
      userInterfaceStyle={scheme}
      showsPointsOfInterests={false}
      showsCompass={false}
      pitchEnabled={false}
      rotateEnabled={false}
      scrollEnabled={interactive}
      zoomEnabled={interactive}>
      {radius !== undefined && (
        <Circle center={ME_LOCATION} radius={radius} strokeColor={theme.accent} strokeWidth={1.5} fillColor="rgba(225, 29, 73, 0.10)" />
      )}
      {showMe && (
        <Marker coordinate={ME_LOCATION} anchor={{ x: 0.5, y: 0.5 }} accessibilityLabel={t.map.you}>
          <View style={styles.me} />
        </Marker>
      )}
      {venues.map((v) => {
        const active = v.id === selectedId;
        return (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.latitude, longitude: v.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            accessibilityLabel={`${v.name}, ${t.people(v.here)}`}
            onPress={() => (onSelect ? onSelect(v.id) : router.push({ pathname: '/venue/[id]', params: { id: v.id } }))}>
            {/* Kalabalık arttıkça pin daha parlak; seçili pin büyür. */}
            <View
              style={[
                styles.pin,
                { backgroundColor: theme.accent, opacity: v.here >= 20 || active ? 1 : 0.75 },
                active && styles.pinActive,
              ]}>
              <View style={styles.pinDot} />
              <Text style={[styles.pinText, active && { fontSize: 15 }]}>{v.here}</Text>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
  if (!recenter) return map;
  return (
    <View style={style ?? { flex: 1 }}>
      {map}
      <Pressable
        onPress={() => mapRef.current?.animateToRegion(region, 350)}
        accessibilityRole="button"
        accessibilityLabel={t.map.recenter}
        hitSlop={6}
        style={styles.recenter}>
        <Glass style={styles.recenterGlass} interactive>
          <Icon ios="location.fill" md="my_location" size={17} color={theme.text} />
        </Glass>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  me: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#0A84FF', borderWidth: 3, borderColor: '#FFFFFF' },
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  recenter: { position: 'absolute', right: 10, bottom: 10 },
  recenterGlass: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pinActive: { height: 34, borderRadius: 17, paddingHorizontal: 12 },
  pinDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  pinText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
