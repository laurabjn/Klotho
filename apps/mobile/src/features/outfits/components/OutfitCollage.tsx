import type { OutfitPiece } from '@klotho/shared';
import { StyleSheet, View } from 'react-native';

import { ItemVisual } from '@/features/wardrobe/components/ItemVisual';
import { colors, radii } from '@/theme/tokens';

/** The pieces that make the look, bag and jewellery after. */
const ORDER = [
  'layer',
  'top',
  'dress',
  'bottom',
  'shoes',
  'bag',
  'jewelry',
  'accessory',
];

/**
 * The look as a small mosaic of its pieces' photos (the mockups show a
 * styled flat lay; the app composes it from the real pieces).
 */
export function OutfitCollage({
  pieces,
  max = 4,
}: {
  pieces: OutfitPiece[];
  max?: number;
}) {
  const shown = [...pieces]
    .sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role))
    .slice(0, max);
  return (
    <View
      style={styles.grid}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {shown.map(({ item }) => (
        <View key={item.id} style={styles.cell}>
          <ItemVisual
            category={item.category}
            color={item.primaryColor}
            photo={item.photos[0]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    borderRadius: radii.input,
    backgroundColor: colors.input,
  },
  cell: { width: '50%', padding: 2 },
});
