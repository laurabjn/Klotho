import type { StyleProfileFields } from '@klotho/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KlothoLogo } from '@/components/brand/KlothoLogo';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { GoldRule } from '@/components/ui/GoldRule';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, radii, spacing } from '@/theme/tokens';

import {
  ColorsSection,
  PracticalSection,
  StylesSection,
  type SectionProps,
} from '../components/PreferenceSections';
import {
  EMPTY_STYLE_PROFILE,
  useSaveStyleProfile,
} from '../hooks/useStyleProfile';

type StepKey = 'welcome' | 'styles' | 'colors' | 'practical';
/** The weather step joins in Sprint 5. */
const STEPS: StepKey[] = ['welcome', 'styles', 'colors', 'practical'];

const SECTIONS: Record<
  Exclude<StepKey, 'welcome'>,
  (props: SectionProps) => React.ReactNode
> = {
  styles: StylesSection,
  colors: ColorsSection,
  practical: PracticalSection,
};

/** Shown once after sign-up; every step is optional. */
export function OnboardingScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [profile, setProfile] =
    useState<StyleProfileFields>(EMPTY_STYLE_PROFILE);
  const save = useSaveStyleProfile();

  const key = STEPS[step]!;
  const isLast = step === STEPS.length - 1;
  const stepLabel = t('onboarding.step', {
    current: step + 1,
    total: STEPS.length,
  });

  // Saving, even an empty profile, marks the onboarding as done.
  const finish = (fields: StyleProfileFields) =>
    save.mutate(fields, { onSuccess: () => router.replace('/') });

  const error = save.error ? (
    <FormError
      message={t(errorMessageKey(save.error) as 'apiErrors.unknown')}
    />
  ) : null;

  const dots = (
    <View style={styles.dots} accessible accessibilityLabel={stepLabel}>
      {STEPS.map((s, i) => (
        <View key={s} style={[styles.dot, i === step && styles.dotActive]} />
      ))}
    </View>
  );

  if (key === 'welcome') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.welcome}>
          <KlothoLogo width={150} />
          <View style={styles.welcomeText}>
            <AppText variant="hero" center>
              {t('onboarding.welcome.title')}
            </AppText>
            <AppText variant="overline" center>
              {t('onboarding.welcome.overline')}
            </AppText>
            <GoldRule centered />
            <AppText center>{t('onboarding.welcome.body')}</AppText>
          </View>
          {dots}
        </ScrollView>
        <View style={styles.footer}>
          {error}
          <Button
            label={t('onboarding.welcome.start')}
            onPress={() => setStep(1)}
          />
          <Button
            variant="secondary"
            label={t('onboarding.welcome.skip')}
            loading={save.isPending}
            onPress={() => finish(EMPTY_STYLE_PROFILE)}
          />
        </View>
      </SafeAreaView>
    );
  }

  const Section = SECTIONS[key];
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title={t(`onboarding.${key}.title`)}
          overline={t(`onboarding.${key}.overline`)}
          onBack={() => setStep(step - 1)}
        />
        <AppText variant="hint">{stepLabel}</AppText>
        {key !== 'styles' && <AppText>{t(`onboarding.${key}.body`)}</AppText>}
        <Section value={profile} onChange={setProfile} />
      </ScrollView>
      <View style={styles.footer}>
        {error}
        {dots}
        <Button
          label={isLast ? t('onboarding.finish') : t('onboarding.continue')}
          loading={save.isPending}
          onPress={() => (isLast ? finish(profile) : setStep(step + 1))}
        />
        <Button
          variant="link"
          label={t('onboarding.welcome.skip')}
          onPress={() => finish(profile)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  welcome: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    padding: spacing.xl,
  },
  welcomeText: { gap: spacing.md },
  content: { gap: spacing.xl, padding: spacing.xl },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  dotActive: { width: 22, backgroundColor: colors.primary },
});
