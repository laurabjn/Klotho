import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, spacing } from '@/theme/tokens';

import {
  SECTION_FIELDS,
  SECTION_ORDER,
  SECTIONS,
  useWardrobeItemForm,
  type SectionKey,
} from '../form/WardrobeItemFormSections';
import { useCreateWardrobeItemWithPhotos } from '../hooks/useWardrobe';
import { LocalPhotoGrid } from '../photos/LocalPhotoGrid';
import type { LocalPhoto } from '../photos/pick-photo';

type Step = 'photo' | SectionKey;

/** Stepper as on the mockup: Photo (optional), Infos, Couleurs, Style, Saison. */
const STEPS: Step[] = ['photo', ...SECTION_ORDER];

export function AddWardrobeItemScreen() {
  const { t } = useTranslation();
  const form = useWardrobeItemForm();
  const create = useCreateWardrobeItemWithPhotos();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);

  const key = STEPS[step]!;
  const isLast = step === STEPS.length - 1;
  const stepLabel = t('wardrobe.form.step', {
    current: step + 1,
    total: STEPS.length,
  });

  const next = async () => {
    if (key !== 'photo' && !(await form.trigger(SECTION_FIELDS[key]))) return;
    if (!isLast) return setStep(step + 1);
    await form.handleSubmit((body) =>
      create.mutate(
        { body, photos },
        {
          onSuccess: ({ item, failed }) =>
            router.replace(
              failed > 0
                ? `/piece/${item.id}?photosFailed=${failed}`
                : `/piece/${item.id}`,
            ),
        },
      ),
    )();
  };

  const Section = key === 'photo' ? null : SECTIONS[key];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <AppHeader />
        <ScreenHeader
          title={t('wardrobe.form.addTitle')}
          overline={t('wardrobe.form.addOverline')}
          onBack={() => (step > 0 ? setStep(step - 1) : router.back())}
        />
        <StepIndicator
          steps={STEPS.map((s) => t(`wardrobe.form.steps.${s}`))}
          current={step}
          accessibilityLabel={stepLabel}
        />
      </View>
      <FormScrollView contentStyle={styles.form}>
        {Section ? (
          <Section form={form} />
        ) : (
          <LocalPhotoGrid photos={photos} onChange={setPhotos} />
        )}
      </FormScrollView>
      <View style={styles.footer}>
        <FormError
          message={
            create.error
              ? t(errorMessageKey(create.error) as 'apiErrors.unknown')
              : null
          }
        />
        {create.isPending && photos.length > 0 && (
          <AppText variant="hint" center accessibilityLiveRegion="polite">
            {t('wardrobe.photos.uploading')}
          </AppText>
        )}
        <Button
          label={
            isLast ? t('wardrobe.form.create') : t('wardrobe.form.continue')
          }
          loading={create.isPending}
          onPress={() => void next()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  form: { gap: spacing.xxl, padding: spacing.xl },
  footer: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
