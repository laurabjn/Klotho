import {
  DISLIKE_REASONS,
  FEEDBACK_NOTE_MAX,
  type DislikeReason,
  type Outfit,
  type OutfitRating,
} from '@klotho/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { FormError } from '@/components/ui/FormError';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { errorMessageKey } from '@/lib/api/errors';
import type { IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { OutfitCollage } from '../components/OutfitCollage';
import { RatingButtons } from '../components/OutfitFeedbackBar';
import { useOutfit, useOutfitFeedback } from '../hooks/useOutfits';
import { outfitSummary } from '../lib/outfit-labels';

const REASON_ICONS: Record<DislikeReason, IconName> = {
  tooDressy: 'bow-tie',
  tooCasual: 'hanger',
  tooWarm: 'white-balance-sunny',
  tooCold: 'snowflake',
  colors: 'palette-outline',
  shoes: 'shoe-heel',
  association: 'link-variant',
  other: 'dots-horizontal',
};

/** "Ton avis sur cette tenue", as on the mockup. */
export function OutfitFeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string; rating?: string }>();
  const outfit = useOutfit(id);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {outfit.data ? (
        <FeedbackForm outfit={outfit.data} />
      ) : (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      )}
    </SafeAreaView>
  );
}

function FeedbackForm({ outfit }: { outfit: Outfit }) {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ rating?: string }>();
  const preset =
    params.rating === 'like' || params.rating === 'dislike'
      ? params.rating
      : null;
  const save = useOutfitFeedback(outfit.id);
  const [rating, setRating] = useState<OutfitRating | null>(
    preset ?? outfit.feedback?.rating ?? null,
  );
  const [reasons, setReasons] = useState<DislikeReason[]>(
    outfit.feedback?.reasons ?? [],
  );
  const [note, setNote] = useState(outfit.feedback?.note ?? '');

  const send = () =>
    rating &&
    save.mutate(
      {
        rating,
        reasons: rating === 'dislike' ? reasons : [],
        note: note.trim() || null,
      },
      { onSuccess: () => router.back() },
    );

  return (
    <>
      <FormScrollView contentStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('outfits.feedback.title')}
          overline={t('outfits.feedback.overline')}
        />

        <View style={styles.card}>
          <View style={styles.proposedText}>
            <AppText variant="heading" style={styles.proposedTitle}>
              {t('outfits.feedback.proposed')}
            </AppText>
            <AppText variant="overline">{outfitSummary(t, outfit)}</AppText>
            <Button
              variant="outline"
              decorated={false}
              label={t('outfits.feedback.see')}
              onPress={() => router.push(`/outfits/${outfit.id}`)}
            />
          </View>
          <View style={styles.collage}>
            <OutfitCollage pieces={outfit.pieces} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.form}>
            <AppText variant="heading" style={styles.question}>
              {t('outfits.feedback.question')}
            </AppText>
            <RatingButtons value={rating} onChange={setRating} />

            {rating === 'dislike' && (
              <View style={styles.section}>
                <AppText variant="overline">
                  {t('outfits.feedback.reasonsTitle')}
                </AppText>
                <AppText variant="hint">
                  {t('outfits.feedback.reasonsHint')}
                </AppText>
                <ChipGroup<DislikeReason>
                  multiple
                  tone="soft"
                  options={DISLIKE_REASONS.map((reason) => ({
                    value: reason,
                    label: t(`outfits.feedback.reasons.${reason}`),
                    icon: REASON_ICONS[reason],
                  }))}
                  value={reasons}
                  onChange={setReasons}
                />
              </View>
            )}

            <View style={styles.section}>
              <AppText variant="overline">
                {t('outfits.feedback.noteTitle')}
              </AppText>
              <View style={styles.noteBox}>
                <TextInput
                  multiline
                  value={note}
                  onChangeText={setNote}
                  maxLength={FEEDBACK_NOTE_MAX}
                  placeholder={t('outfits.feedback.notePlaceholder')}
                  placeholderTextColor={colors.placeholder}
                  accessibilityLabel={t('outfits.feedback.noteTitle')}
                  style={styles.note}
                />
                <AppText variant="hint" style={styles.counter}>
                  {`${note.length}/${FEEDBACK_NOTE_MAX}`}
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </FormScrollView>
      <View style={styles.footer}>
        <FormError
          message={
            save.error
              ? t(errorMessageKey(save.error) as 'apiErrors.unknown')
              : null
          }
        />
        <Button
          label={t('outfits.feedback.send')}
          disabled={!rating}
          loading={save.isPending}
          onPress={send}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxxl },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  proposedText: { flex: 1, gap: spacing.sm, alignItems: 'flex-start' },
  proposedTitle: { fontSize: 22, lineHeight: 27 },
  collage: { width: '46%' },
  form: { flex: 1, gap: spacing.lg },
  question: { fontSize: 22, lineHeight: 27 },
  section: { gap: spacing.sm },
  noteBox: {
    minHeight: 96,
    padding: spacing.md,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  note: {
    flex: 1,
    minHeight: 56,
    padding: 0,
    textAlignVertical: 'top',
    fontFamily: fonts.serifRegular,
    fontSize: 16,
    color: colors.body,
  },
  counter: { alignSelf: 'flex-end' },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
