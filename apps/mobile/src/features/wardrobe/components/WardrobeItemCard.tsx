import type { WardrobeItem } from '@klotho/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ColorDot } from '@/components/ui/ColorDot';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

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
            <AppText variant="hint" style={styles.badgeText} numberOfLines={1}>
              {unavailable}
            </AppText>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <AppText numberOfLines={1} style={styles.name}>
          {title}
        </AppText>
        <View style={styles.row}>
          <ColorDot color={item.primaryColor} size={12} />
          <AppText variant="hint" numberOfLines={1} style={styles.flex}>
            {colorName}
          </AppText>
          {style && (
            <View style={styles.tag}>
              <AppText variant="hint" numberOfLines={1} style={styles.tagText}>
                {style}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radii.input,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pressed: { opacity: 0.8 },
  body: { gap: spacing.xs, padding: spacing.sm },
  name: {
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 20,
    color: colors.title,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flex: { flex: 1 },
  tag: {
    maxWidth: '55%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  tagText: { fontSize: 11, lineHeight: 15 },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    right: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 249, 245, 0.92)',
  },
  badgeText: { color: colors.title, fontSize: 11 },
});
