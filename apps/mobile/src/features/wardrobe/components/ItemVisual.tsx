import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, type ColorKey, type WardrobeCategory } from '@klotho/shared';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme/tokens';

const ICONS: Record<
  WardrobeCategory,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  TOP: 'tshirt-crew-outline',
  BOTTOM: 'human-male-height-variant', // no trousers glyph in the set
  DRESS: 'human-female',
  LAYER: 'hanger',
  SHOES: 'shoe-heel',
  BAG: 'purse-outline',
  ACCESSORY: 'sunglasses',
  JEWELRY: 'necklace',
  UNDERWEAR: 'tshirt-v-outline',
};

/** Perceived brightness, to pick a readable icon colour over the swatch. */
function isLight(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (r! * 299 + g! * 587 + b! * 114) / 1000 > 150;
}

/**
 * Stand-in for the photo (Sprint 3): the main colour with the category icon.
 * Decorative only: the card or screen already names the piece.
 */
export function ItemVisual({
  category,
  color,
  size = 'card',
}: {
  category: WardrobeCategory;
  color: ColorKey;
  size?: 'card' | 'hero';
}) {
  const hex = COLORS[color];
  return (
    <View
      style={[
        styles.box,
        size === 'hero' && styles.hero,
        { backgroundColor: hex },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <MaterialCommunityIcons
        name={ICONS[category]}
        size={size === 'hero' ? 96 : 52}
        color={
          isLight(hex) ? 'rgba(62, 35, 28, 0.45)' : 'rgba(255, 255, 255, 0.75)'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    aspectRatio: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.card - 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  hero: { aspectRatio: 4 / 3, borderRadius: radii.card },
});
