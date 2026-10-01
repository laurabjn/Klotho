import { Ionicons } from '@expo/vector-icons';
import type { Outfit, OutfitRating } from '@klotho/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { useOutfitFeedback } from '../hooks/useOutfits';

/**
 * "Cette tenue te plaît-elle ?" under a look: a like is saved at once, a
 * dislike opens the screen asking why.
 */
export function OutfitFeedbackBar({ outfit }: { outfit: Outfit }) {
  const { t } = useTranslation();
  const feedback = useOutfitFeedback(outfit.id);
  const rating = feedback.variables?.rating ?? outfit.feedback?.rating ?? null;
  const openForm = (preset?: OutfitRating) =>
    router.push({
      pathname: '/outfits/[id]/feedback',
      params: { id: outfit.id, ...(preset && { rating: preset }) },
    });

  return (
    <View style={styles.card}>
      <AppText variant="heading" style={styles.title}>
        {rating
          ? t(`outfits.feedback.given.${rating}`)
          : t('outfits.feedback.question')}
      </AppText>
      <RatingButtons
        value={rating}
        onChange={(next) =>
          next === 'like'
            ? feedback.mutate({ rating: 'like' })
            : openForm('dislike')
        }
      />
      {rating && (
        <Button
          variant="link"
          decorated={false}
          label={t('outfits.feedback.change')}
          onPress={() => openForm()}
        />
      )}
    </View>
  );
}

/** "J'aime" / "Je n'aime pas", side by side. */
export function RatingButtons({
  value,
  onChange,
}: {
  value: OutfitRating | null;
  onChange: (rating: OutfitRating) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.buttons} accessibilityRole="radiogroup">
      {(['like', 'dislike'] as const).map((rating) => {
        const selected = value === rating;
        return (
          <Pressable
            key={rating}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t(`outfits.feedback.${rating}`)}
            onPress={() => onChange(rating)}
            style={({ pressed }) => [
              styles.button,
              selected && styles.buttonOn,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={
                rating === 'like'
                  ? selected
                    ? 'heart'
                    : 'heart-outline'
                  : selected
                    ? 'heart-dislike'
                    : 'heart-dislike-outline'
              }
              size={20}
              color={selected ? colors.onPrimary : colors.primary}
            />
            <AppText
              numberOfLines={1}
              maxFontSizeMultiplier={1.15}
              style={[styles.label, selected && styles.labelOn]}
            >
              {t(`outfits.feedback.${rating}`)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { fontSize: 21, lineHeight: 26 },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  button: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#E2C4BA',
    backgroundColor: colors.background,
  },
  buttonOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  label: {
    flexShrink: 1,
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.title,
  },
  labelOn: { color: colors.onPrimary },
});
