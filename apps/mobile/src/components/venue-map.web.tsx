import { View } from 'react-native';

import { Text } from '@/components/text';
import type { VenueMapProps } from '@/components/venue-map';
import { useTheme } from '@/hooks/use-theme';

// react-native-maps web'i desteklemez; web önizlemede yer tutucu gösterilir.
export function VenueMap({ venues, style }: VenueMapProps) {
  const theme = useTheme();
  return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.backgroundElement }, style]}>
      <Text style={{ color: theme.textSecondary }}>Harita yalnızca telefonda · {venues.length} mekân</Text>
    </View>
  );
}
