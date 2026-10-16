import { router } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { Text } from '@/components/text';
import { ME_LOCATION, type Venue } from '@/data/mock';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

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
};

// Prototipte iOS'ta Apple Haritalar kullanılır. Google Places verisi geldiğinde (K-05)
// Google sağlayıcısına geçilecek.
export function VenueMap({ venues, selectedId, onSelect, style, radius, showMe, interactive = true, zoom = 0.018 }: VenueMapProps) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const center = showMe ? ME_LOCATION : { latitude: 40.988, longitude: 29.027 };

  return (
    <MapView
      style={style ?? { flex: 1 }}
      initialRegion={{ ...center, latitudeDelta: zoom, longitudeDelta: zoom }}
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
        <Marker coordinate={ME_LOCATION} anchor={{ x: 0.5, y: 0.5 }} accessibilityLabel="Konumun">
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
            accessibilityLabel={`${v.name}, ${v.here} kişi`}
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
  pinActive: { height: 34, borderRadius: 17, paddingHorizontal: 12 },
  pinDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  pinText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
