import type { StyleProfileFields } from '@klotho/shared';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import type { LocationChoice } from '@/features/weather/components/LocationSetup';
import { WeatherPermissionStep } from '@/features/weather/components/WeatherPermissionStep';
import { useSaveWeatherSettings } from '@/features/weather/hooks/useWeatherSettings';
import { errorMessageKey } from '@/lib/api/errors';
import { photos } from '@/theme/photos';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

import {
  ColorsSection,
  PracticalSection,
  type SectionProps,
} from '../components/PreferenceSections';
import { StyleCards } from '../components/StyleCards';
import {
  EMPTY_STYLE_PROFILE,
  useSaveStyleProfile,
} from '../hooks/useStyleProfile';

type StepKey = 'welcome' | 'styles' | 'colors' | 'practical' | 'weather';
const STEPS: StepKey[] = [
  'welcome',
  'styles',
  'colors',
  'practical',
  'weather',
];

const CLEAR = 'rgba(251, 247, 242, 0)';

function StylesStep({ value, onChange }: SectionProps) {
  return (
    <StyleCards
      value={value.preferredStyles}
      onChange={(preferredStyles) => onChange({ ...value, preferredStyles })}
    />
  );
}

function ColorsStep(props: SectionProps) {
  return <ColorsSection {...props} large />;
}

const SECTIONS: Record<
  Exclude<StepKey, 'welcome' | 'weather'>,
  (props: SectionProps) => ReactNode
> = {
  styles: StylesStep,
  colors: ColorsStep,
  practical: PracticalSection,
};

/** Shown once after sign-up; every step is optional. */
export function OnboardingScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [profile, setProfile] =
    useState<StyleProfileFields>(EMPTY_STYLE_PROFILE);
  const [location, setLocation] = useState<LocationChoice>({
    locationMode: null,
    city: null,
  });
  const saveProfile = useSaveStyleProfile();
  const saveWeather = useSaveWeatherSettings();
  const saving = saveProfile.isPending || saveWeather.isPending;
  const saveError = saveProfile.error ?? saveWeather.error;

  const key = STEPS[step]!;
  const isLast = step === STEPS.length - 1;
  const stepLabel = t('onboarding.step', {
    current: step + 1,
    total: STEPS.length,
  });

  // Saving, even an empty profile, marks the onboarding as done. The
  // weather is saved only if a choice was made (a city picked, if needed).
  const finish = async (
    fields: StyleProfileFields,
    weather: LocationChoice = location,
  ) => {
    const weatherChosen =
      weather.locationMode === 'device' ||
      (weather.locationMode === 'city' && weather.city !== null);
    try {
      await saveProfile.mutateAsync(fields);
      if (weatherChosen) await saveWeather.mutateAsync(weather);
      router.replace('/');
    } catch {
      // Shown by the FormError below.
    }
  };

  const error = saveError ? (
    <FormError message={t(errorMessageKey(saveError) as 'apiErrors.unknown')} />
  ) : null;

  const dots = (
    <View style={styles.dots}>
      {STEPS.map((s, i) => (
        <View key={s} style={[styles.dot, i <= step && styles.dotActive]} />
      ))}
    </View>
  );

  const progress = (
    <View style={styles.progress} accessible accessibilityLabel={stepLabel}>
      <AppText style={styles.stepText}>{stepLabel}</AppText>
      {dots}
    </View>
  );

  if (key === 'welcome') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.welcome}>
          <View style={styles.padded}>
            <AppHeader right={progress} />
            <View style={styles.welcomeText}>
              <AppText variant="hero">{t('onboarding.welcome.title')}</AppText>
              <AppText variant="overline">
                {t('onboarding.welcome.overline')}
              </AppText>
              <AppText>{t('onboarding.welcome.body')}</AppText>
            </View>
          </View>
          <View
            style={styles.welcomePhoto}
            importantForAccessibility="no-hide-descendants"
          >
            <Image
              source={photos.welcome.source}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={[colors.background, CLEAR, CLEAR, colors.background]}
              locations={[0, 0.2, 0.85, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={[styles.padded, styles.welcomeActions]}>
            {error}
            <Button
              label={t('onboarding.welcome.start')}
              onPress={() => setStep(1)}
            />
            <Button
              variant="outline"
              label={t('onboarding.welcome.skip')}
              loading={saving}
              onPress={() => void finish(EMPTY_STYLE_PROFILE)}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const Section = key === 'weather' ? null : SECTIONS[key];
  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      onPress={() => setStep(step - 1)}
      hitSlop={4}
      style={styles.back}
    >
      <Ionicons name="chevron-back" size={22} color={colors.title} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* The same step indicator on every step. */}
        <AppHeader right={progress} />
        {back}
        <View style={styles.titles}>
          <AppText variant="title" center>
            {t(`onboarding.${key}.title`)}
          </AppText>
          <AppText variant="overline" center>
            {t(`onboarding.${key}.overline`)}
          </AppText>
        </View>
        {(key === 'colors' || key === 'practical') && (
          <AppText center>{t(`onboarding.${key}.body`)}</AppText>
        )}
        {Section ? (
          <Section value={profile} onChange={setProfile} />
        ) : (
          <WeatherPermissionStep
            value={location}
            onChange={setLocation}
            finishing={saving}
            onFinish={(choice) => void finish(profile, choice)}
          />
        )}
        {key === 'weather' && error}
      </ScrollView>
      {!isLast && (
        <View style={styles.footer}>
          {key === 'colors' && (
            <View
              style={StyleSheet.absoluteFill}
              importantForAccessibility="no-hide-descendants"
            >
              <Image
                source={photos.colorsFooter.source}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              <LinearGradient
                colors={[colors.background, CLEAR]}
                locations={[0, 0.5]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}
          {error}
          <Button
            label={t('onboarding.continue')}
            onPress={() => setStep(step + 1)}
          />
          {key !== 'colors' && (
            <Button
              variant="link"
              label={t('onboarding.back')}
              onPress={() => setStep(step - 1)}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.xl },
  welcome: { flexGrow: 1, paddingTop: spacing.md, paddingBottom: spacing.xl },
  welcomeText: { gap: spacing.md, marginTop: spacing.xxl },
  // At least the photo's own proportions, more on tall screens.
  welcomePhoto: {
    flexGrow: 1,
    width: '100%',
    minHeight: 260,
    aspectRatio: photos.welcome.ratio,
    marginTop: spacing.md,
  },
  welcomeActions: { gap: spacing.md },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  back: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  titles: { gap: spacing.xs, marginTop: -spacing.md },
  progress: { alignItems: 'flex-end', gap: spacing.xs },
  stepText: { fontFamily: fonts.serif, fontSize: 17, color: colors.title },
  footer: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary },
});
