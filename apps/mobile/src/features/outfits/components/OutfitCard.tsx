import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Outfit } from '@klotho/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { occasionIcons, styleIcons } from '@/theme/icons';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { outfitTitle } from '../lib/outfit-labels';
import { OutfitCollage } from './OutfitCollage';

/** One proposal in the results: title, conditions, why, and its pieces. */
export function OutfitCard({
  outfit,
  onPress,
}: {
  outfit: Outfit;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const title = outfitTitle(t, outfit);
  const why = outfit.highlights[0];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${t('outfits.results.see')}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <AppText variant="heading">{title}</AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tags}
        >
          {outfit.style && (
            <Tag icon={styleIcons[outfit.style]}>
              {t(`wardrobe.styles.${outfit.style}`)}
            </Tag>
          )}
          {outfit.occasion && (
            <Tag icon={occasionIcons[outfit.occasion]}>
              {t(`outfits.occasions.${outfit.occasion}`)}
            </Tag>
          )}
          {outfit.temperature !== null && (
            <Tag icon="thermometer">{`${outfit.temperature}°C`}</Tag>
          )}
        </ScrollView>
        {why && (
          <AppText variant="hint" numberOfLines={2}>
            {t(`outfits.highlights.${why}`)}
          </AppText>
        )}
        <View style={styles.see}>
          <AppText style={styles.seeText}>{t('outfits.results.see')}</AppText>
          <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
        </View>
      </View>
      <View style={styles.collage}>
        <OutfitCollage pieces={outfit.pieces} />
      </View>
    </Pressable>
  );
}

function Tag({
  icon,
  children,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  children: string;
}) {
  return (
    <View style={styles.tag}>
      <MaterialCommunityIcons name={icon} size={14} color={colors.primary} />
      <AppText style={styles.tagText}>{children}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pressed: { opacity: 0.85 },
  text: { flex: 1, gap: spacing.sm },
  tags: { gap: spacing.xs },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  tagText: { fontSize: 13, lineHeight: 16, color: colors.title },
  see: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  seeText: { fontFamily: fonts.serif, fontSize: 15, color: colors.onPrimary },
  collage: { width: '46%' },
});
