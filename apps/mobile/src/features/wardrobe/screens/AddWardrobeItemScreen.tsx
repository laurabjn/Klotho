import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
} from '../form/WardrobeItemFormSections';
import { useCreateWardrobeItem } from '../hooks/useWardrobe';

/** Stepper as on the mockup (the "Photo" step arrives with Sprint 3). */
export function AddWardrobeItemScreen() {
  const { t } = useTranslation();
  const form = useWardrobeItemForm();
  const create = useCreateWardrobeItem();
  const [step, setStep] = useState(0);

  const key = SECTION_ORDER[step]!;
  const Section = SECTIONS[key];
  const isLast = step === SECTION_ORDER.length - 1;
  const stepLabels = SECTION_ORDER.map((section) =>
    t(`wardrobe.form.steps.${section}`),
  );

  const next = async () => {
    if (!(await form.trigger(SECTION_FIELDS[key]))) return;
    if (!isLast) return setStep(step + 1);
    await form.handleSubmit((values) =>
      create.mutate(values, {
        onSuccess: (item) => router.replace(`/piece/${item.id}`),
      }),
    )();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <ScreenHeader
          title={t('wardrobe.form.addTitle')}
          overline={t('wardrobe.form.step', {
            current: step + 1,
            total: SECTION_ORDER.length,
          })}
          onBack={() => (step > 0 ? setStep(step - 1) : router.back())}
        />
        <StepIndicator
          steps={stepLabels}
          current={step}
          accessibilityLabel={t('wardrobe.form.step', {
            current: step + 1,
            total: SECTION_ORDER.length,
          })}
        />
      </View>
      <FormScrollView contentStyle={styles.form}>
        <Section form={form} />
      </FormScrollView>
      <View style={styles.footer}>
        <FormError
          message={
            create.error
              ? t(errorMessageKey(create.error) as 'apiErrors.unknown')
              : null
          }
        />
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
