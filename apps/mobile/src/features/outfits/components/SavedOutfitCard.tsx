import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Outfit } from '@klotho/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { occasionIcons, styleIcons, type IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

import { useToggleOutfitFavorite } from '../hooks/useOutfits';
import { outfitSummary, outfitTitle } from '../lib/outfit-labels';
import { OutfitCollage } from './OutfitCollage';

/** A saved look, as on the "Mes favoris" mockup: collage, words, heart. */
export function SavedOutfitCard({ outfit }: { outfit: Outfit }) {
  const { t } = useTranslation();
  const favorite = useToggleOutfitFavorite(outfit.id);
  const title = outfitTitle(t, outfit);
  const open = () => router.push(`/outfits/${outfit.id}`);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${t('outfits.mine.see')}`}
        onPress={open}
        style={styles.collage}
      >
        <OutfitCollage pieces={outfit.pieces} />
      </Pressable>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <AppText variant="heading" style={styles.title}>
            {title}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              outfit.isFavorite
                ? t('outfits.mine.unfavorite')
                : t('outfits.details.favorite')
            }
            accessibilityState={{ selected: outfit.isFavorite }}
            onPress={() => favorite.mutate(!outfit.isFavorite)}
            hitSlop={6}
            style={[styles.heart, outfit.isFavorite && styles.heartOn]}
          >
            <Ionicons
              name={outfit.isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={outfit.isFavorite ? colors.onPrimary : colors.primary}
            />
          </Pressable>
        </View>
        <AppText variant="overline" numberOfLines={3}>
          {outfitSummary(t, outfit)}
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tags}
        >
          {outfit.style && (
            <Tag icon={styleIcons[outfit.style]} highlight>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('outfits.mine.see')}
          onPress={open}
          style={({ pressed }) => [styles.see, pressed && styles.pressed]}
        >
          <AppText
            numberOfLines={1}
            maxFontSizeMultiplier={1.15}
            style={styles.seeText}
          >
            {t('outfits.mine.see')}
          </AppText>
          <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function Tag({
  icon,
  children,
  highlight = false,
}: {
  icon: IconName;
  children: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.tag, highlight && styles.tagOn]}>
      <MaterialCommunityIcons name={icon} size={14} color={colors.primary} />
      <AppText maxFontSizeMultiplier={1.15} style={styles.tagText}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
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
  collage: { width: '42%', alignSelf: 'center' },
  text: { flex: 1, gap: spacing.sm, paddingVertical: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  title: { flex: 1, fontSize: 20, lineHeight: 24 },
  heart: {
    width: touchTarget - 8,
    height: touchTarget - 8,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  heartOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tags: { gap: spacing.xs },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  tagOn: { backgroundColor: colors.primaryLight },
  tagText: { fontFamily: fonts.serif, fontSize: 13, color: colors.title },
  see: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 40,
    marginTop: 'auto',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  seeText: {
    flexShrink: 1,
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.onPrimary,
  },
  pressed: { opacity: 0.8 },
});
