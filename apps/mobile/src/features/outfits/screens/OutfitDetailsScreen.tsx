import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Outfit } from '@klotho/shared';
import type { TFunction } from 'i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { errorMessageKey } from '@/lib/api/errors';
import { today } from '@/lib/days';
import { occasionIcons, styleIcons, type IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

import { OutfitCollage } from '../components/OutfitCollage';
import { OutfitItemTile } from '../components/OutfitItemTile';
import { itemTitle } from '@/features/wardrobe/labels';
import { OutfitFeedbackBar } from '../components/OutfitFeedbackBar';
import {
  useMarkWorn,
  useOutfit,
  useToggleOutfitFavorite,
} from '../hooks/useOutfits';
import {
  outfitSummary,
  outfitTitle,
  weatherChoiceOf,
} from '../lib/outfit-labels';

/** "Détail de la tenue". */
export function OutfitDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const outfit = useOutfit(id);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {outfit.data ? (
        <Details outfit={outfit.data} />
      ) : outfit.isError ? (
        <View style={styles.content}>
          <ScreenHeader title={t('outfits.details.title')} />
          <EmptyState
            icon="alert-circle-outline"
            title={t('outfits.details.notFound')}
            body={t(errorMessageKey(outfit.error) as 'apiErrors.unknown')}
            actionLabel={t('common.back')}
            onAction={() => router.back()}
          />
        </View>
      ) : (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      )}
    </SafeAreaView>
  );
}

function Details({ outfit }: { outfit: Outfit }) {
  const { t } = useTranslation();
  const favorite = useToggleOutfitFavorite(outfit.id);
  const wear = useMarkWorn(outfit.id);
  const conditionKey = weatherChoiceOf(outfit.condition);
  const wornToday = outfit.lastWornOn === today();

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('outfits.details.title')}
          overline={t('outfits.details.overline')}
          right={
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  outfit.isFavorite
                    ? t('outfits.details.unfavorite')
                    : t('outfits.details.favorite')
                }
                accessibilityState={{ selected: outfit.isFavorite }}
                onPress={() => favorite.mutate(!outfit.isFavorite)}
                style={[styles.round, outfit.isFavorite && styles.roundOn]}
              >
                <Ionicons
                  name={outfit.isFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={outfit.isFavorite ? colors.onPrimary : colors.primary}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('outfits.details.share')}
                onPress={() => void share(t, outfit)}
                style={styles.round}
              >
                <Ionicons name="share-outline" size={22} color={colors.title} />
              </Pressable>
            </View>
          }
        />

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.flex}>
              <AppText variant="title" style={styles.heroTitle}>
                {outfitTitle(t, outfit)}
              </AppText>
              <AppText style={styles.summary}>
                {outfitSummary(t, outfit)}
              </AppText>
            </View>
            <View style={styles.heroCollage}>
              <OutfitCollage pieces={outfit.pieces} />
            </View>
          </View>
          {/* The context of the look, on one line scrolling sideways. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsBleed}
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
            {conditionKey && (
              <Tag icon="weather-cloudy">
                {t(`outfits.conditions.${conditionKey}`)}
              </Tag>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <AppText variant="heading">{t('outfits.details.pieces')}</AppText>
          {/* Every piece at a glance: small tiles on one line. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.pieces}
          >
            {outfit.pieces.map(({ item }) => (
              <OutfitItemTile
                key={item.id}
                item={item}
                width={PIECE_WIDTH}
                small
                onPress={() => router.push(`/piece/${item.id}`)}
              />
            ))}
          </ScrollView>
        </View>

        {outfit.highlights.length > 0 && (
          <View style={styles.why}>
            <View style={styles.sparkle}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading">{t('outfits.details.why')}</AppText>
              {outfit.highlights.map((highlight) => (
                <AppText key={highlight}>
                  {t(`outfits.highlights.${highlight}`)}
                </AppText>
              ))}
            </View>
          </View>
        )}

        <OutfitFeedbackBar outfit={outfit} />

        {/* Stacked, so the labels keep their full size. */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            icon="shuffle"
            label={t('outfits.details.variant')}
            onPress={() => router.push(`/outfits/${outfit.id}/variant`)}
          />
          <Button
            variant="outline"
            icon="swap-horizontal"
            label={t('outfits.details.replace')}
            onPress={() => router.push(`/outfits/${outfit.id}/replace`)}
          />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <FormError
          message={
            wear.error
              ? t(errorMessageKey(wear.error) as 'apiErrors.unknown')
              : null
          }
        />
        {wornToday ? (
          <Button
            variant="secondary"
            icon="checkmark-circle-outline"
            label={t('outfits.details.wornToday')}
            onPress={() => router.navigate('/calendar')}
          />
        ) : (
          <Button
            label={t('outfits.details.wear')}
            loading={wear.isPending}
            onPress={() => wear.mutate(today())}
          />
        )}
      </View>
    </>
  );
}

/** Width of a piece tile: about five on a line, as on the mockup. */
const PIECE_WIDTH = 72;

/** Shares the look as text (title and pieces) with the system sheet. */
async function share(t: TFunction, outfit: Outfit) {
  try {
    await Share.share({
      message: t('outfits.details.shareMessage', {
        title: outfitTitle(t, outfit),
        pieces: outfit.pieces.map(({ item }) => itemTitle(t, item)).join(', '),
      }),
    });
  } catch {
    // Closed or unavailable: nothing to do.
  }
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
    <View style={[styles.tag, highlight && styles.tagHighlight]}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.primary} />
      <AppText style={styles.tagText}>{children}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxxl },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  roundOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  round: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  hero: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heroCollage: { width: '50%' },
  tagsBleed: { marginHorizontal: -spacing.lg },
  tags: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  tagHighlight: { backgroundColor: colors.primaryLight },
  tagText: { fontFamily: fonts.serif, fontSize: 15, color: colors.title },
  heroTitle: { fontSize: 26, lineHeight: 30 },
  section: { gap: spacing.md },
  bleed: { marginHorizontal: -spacing.xl },
  pieces: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  summary: { fontSize: 14, lineHeight: 19, marginTop: spacing.sm },
  why: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sparkle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  flex: { flex: 1, gap: spacing.xs },
  actions: { gap: spacing.sm },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
