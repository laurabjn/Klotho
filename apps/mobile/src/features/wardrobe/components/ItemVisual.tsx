import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  COLORS,
  type ColorKey,
  type WardrobeCategory,
  type WardrobePhoto,
} from '@klotho/shared';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { categoryIcons } from '@/theme/icons';
import { radii } from '@/theme/tokens';

/** Perceived brightness, to pick a readable icon colour over the swatch. */
function isLight(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (r! * 299 + g! * 587 + b! * 114) / 1000 > 150;
}

/**
 * The main photo when there is one, otherwise the main colour with the
 * category icon. Decorative only: the card or screen already names the piece.
 */
export function ItemVisual({
  category,
  color,
  photo,
  size = 'card',
}: {
  category: WardrobeCategory;
  color: ColorKey;
  photo?: WardrobePhoto;
  size?: 'card' | 'hero';
}) {
  const hex = COLORS[color];
  if (photo) {
    return (
      <Image
        // Signed URLs change on every load: cache by photo id instead.
        source={{ uri: photo.url, cacheKey: photo.id }}
        contentFit="cover"
        transition={150}
        recyclingKey={photo.id}
        // The item colour shows while the photo loads.
        style={[
          styles.box,
          size === 'hero' && styles.hero,
          { backgroundColor: hex },
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }
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
        name={categoryIcons[category]}
        size={size === 'hero' ? 96 : 40}
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
  },
  hero: { aspectRatio: 4 / 3, borderRadius: radii.card },
});
