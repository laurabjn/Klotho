import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { colors, radii } from '@/theme/tokens';

/**
 * The round heart of the mockups, on a photo or a card: rose outline,
 * filled once in the favourites.
 */
export function HeartButton({
  on,
  label,
  onPress,
  size = 32,
  style,
}: {
  on: boolean;
  label: string;
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.heart,
        { width: size, height: size },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Ionicons
        name={on ? 'heart' : 'heart-outline'}
        size={Math.round(size * 0.56)}
        color={colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heart: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 249, 245, 0.94)',
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  pressed: { opacity: 0.7 },
});
