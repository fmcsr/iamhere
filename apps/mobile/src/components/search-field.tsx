import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { TextInput } from '@/components/text';
import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** İçerikteki arama alanı (başlık çubuğu olmayan ekranlar için): yarı saydam dolgu, büyüteç, temizle. */
export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (text: string) => void; placeholder: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: theme.fill }]}>
      <Icon ios="magnifyingglass" md="search" size={16} color={theme.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        style={[Type.body, styles.input, { color: theme.text }]}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Aramayı temizle">
          <Icon ios="xmark.circle.fill" md="cancel" size={17} color={theme.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: 22, paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 0 },
});
