import type { WardrobeItem } from '@klotho/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ColorDot } from '@/components/ui/ColorDot';
import { ItemVisual } from '@/features/wardrobe/components/ItemVisual';
import { itemTitle } from '@/features/wardrobe/labels';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

/** A piece of a look: photo, name and colour ("Pièces de la tenue"). */
export function OutfitItemTile({
  item,
  onPress,
  selected = false,
  width,
  small = false,
}: {
  item: WardrobeItem;
  onPress?: () => void;
  selected?: boolean;
  /** Fixed width in a row; fills its cell in a grid when omitted. */
  width?: number;
  /** Tiny tile (a whole look on one line): one-line name, smaller text. */
  small?: boolean;
}) {
  const { t } = useTranslation();
  const title = itemTitle(t, item);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.tile,
        width !== undefined && { width },
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <ItemVisual
        category={item.category}
        color={item.primaryColor}
        photo={item.photos[0]}
      />
      <View style={[styles.text, small && styles.textSmall]}>
        <AppText
          numberOfLines={small ? 1 : 2}
          maxFontSizeMultiplier={1.1}
          style={[styles.name, small && styles.nameSmall]}
        >
          {title}
        </AppText>
        <View style={styles.row}>
          <ColorDot color={item.primaryColor} size={small ? 8 : 10} />
          <AppText
            variant="hint"
            numberOfLines={1}
            maxFontSizeMultiplier={1.1}
            style={[styles.flex, small && styles.hintSmall]}
          >
            {t(`wardrobe.colors.${item.primaryColor}`)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: 'hidden',
    borderRadius: radii.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { borderWidth: 1.5, borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  text: { gap: 2, padding: spacing.xs + 2 },
  name: {
    fontFamily: fonts.serif,
    fontSize: 13,
    lineHeight: 17,
    color: colors.title,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textSmall: { gap: 0, padding: spacing.xs },
  nameSmall: { fontSize: 12, lineHeight: 15 },
  hintSmall: { fontSize: 10, lineHeight: 13 },
  flex: { flex: 1 },
});
