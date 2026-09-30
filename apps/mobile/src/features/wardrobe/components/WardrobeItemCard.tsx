import type { WardrobeItem } from '@klotho/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ColorDot } from '@/components/ui/ColorDot';
import { colors, radii, spacing } from '@/theme/tokens';

import { itemTitle } from '../labels';
import { ItemVisual } from './ItemVisual';

/** Grid card: visual, name, main colour, first style, and availability if not available. */
export function WardrobeItemCard({
  item,
  onPress,
}: {
  item: WardrobeItem;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const title = itemTitle(t, item);
  const colorName = t(`wardrobe.colors.${item.primaryColor}`);
  const style = item.styles[0] && t(`wardrobe.styles.${item.styles[0]}`);
  const unavailable =
    item.status !== 'AVAILABLE' && t(`wardrobe.statuses.${item.status}`);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, colorName, style, unavailable]
        .filter(Boolean)
        .join(', ')}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View>
        <ItemVisual
          category={item.category}
          color={item.primaryColor}
          photo={item.photos[0]}
        />
        {unavailable && (
          <View style={styles.badge}>
            <AppText variant="hint" style={styles.badgeText}>
              {unavailable}
            </AppText>
          </View>
        )}
      </View>
      <AppText variant="label" numberOfLines={1}>
        {title}
      </AppText>
      <View style={styles.row}>
        <ColorDot color={item.primaryColor} size={10} />
        <AppText variant="hint" numberOfLines={1} style={styles.flex}>
          {colorName}
        </AppText>
      </View>
      {style && (
        <View style={styles.tag}>
          <AppText variant="hint" numberOfLines={1}>
            {style}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.xs + 2,
    padding: spacing.sm,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pressed: { opacity: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  flex: { flex: 1 },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: '#E9DCD3',
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 249, 245, 0.92)',
  },
  badgeText: { color: colors.title },
});
