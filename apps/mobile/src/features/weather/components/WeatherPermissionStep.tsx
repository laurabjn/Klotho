import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { photos } from '@/theme/photos';
import { colors, spacing } from '@/theme/tokens';

import {
  requestLocationPermission,
  type PermissionAnswer,
} from '../lib/device-position';
import { CitySearch } from './CitySearch';
import { LocationBlockedScreen } from './LocationBlockedScreen';
import type { LocationChoice } from './LocationSetup';

const CLEAR = 'rgba(251, 247, 242, 0)';

interface WeatherPermissionStepProps {
  value: LocationChoice;
  onChange: (next: LocationChoice) => void;
  /** Ends the onboarding with the given choice. */
  onFinish: (choice: LocationChoice) => void;
  finishing: boolean;
}

/**
 * Onboarding "Météo & localisation": the permission is asked only when
 * "Autoriser" is pressed; a refusal opens the city search instead.
 */
export function WeatherPermissionStep({
  value,
  onChange,
  onFinish,
  finishing,
}: WeatherPermissionStepProps) {
  const { t } = useTranslation();
  const [refusal, setRefusal] = useState<Exclude<
    PermissionAnswer,
    'granted'
  > | null>(null);
  const [asking, setAsking] = useState(false);
  const [blockedVisible, setBlockedVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const choosingCity = value.locationMode === 'city';

  const allow = async () => {
    setAsking(true);
    const answer = await requestLocationPermission().finally(() =>
      setAsking(false),
    );
    if (answer === 'granted') {
      const choice = { ...value, locationMode: 'device' as const };
      onChange(choice);
      onFinish(choice);
    } else {
      setRefusal(answer);
      setBlockedVisible(answer === 'blocked');
      onChange({ ...value, locationMode: 'city' });
    }
  };

  return (
    <View style={styles.container}>
      <AppText center>{t('onboarding.weather.body')}</AppText>
      {choosingCity ? (
        <View style={styles.city}>
          {refusal && (
            <View accessibilityLiveRegion="polite" style={styles.refusal}>
              <AppText>
                {t(
                  refusal === 'blocked'
                    ? 'weather.location.blocked'
                    : 'weather.location.denied',
                )}
              </AppText>
              {refusal === 'blocked' && (
                <Button
                  variant="link"
                  label={t('weather.location.openSettings')}
                  onPress={() => void Linking.openSettings()}
                />
              )}
            </View>
          )}
          <CitySearch
            value={value.city}
            onChange={(city) => onChange({ ...value, city })}
          />
          <Button
            label={t('onboarding.finish')}
            loading={finishing}
            onPress={() => onFinish(value)}
          />
        </View>
      ) : (
        <>
          <View
            style={[styles.photo, { aspectRatio: photos.weather.ratio }]}
            importantForAccessibility="no-hide-descendants"
          >
            <Image
              source={photos.weather.source}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={[colors.background, CLEAR, CLEAR, colors.background]}
              locations={[0, 0.12, 0.8, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
          {/* Pulled up over the bottom of the photo, as on the mockup. */}
          <View style={styles.overPhoto}>
            <Button
              label={t('onboarding.weather.allow')}
              loading={asking || finishing}
              onPress={() => void allow()}
            />
          </View>
          <Button
            variant="outline"
            icon="location-outline"
            label={t('onboarding.weather.chooseCity')}
            onPress={() => onChange({ ...value, locationMode: 'city' })}
          />
        </>
      )}
      <View style={styles.privacy}>
        <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
        <View style={styles.privacyText}>
          <AppText style={styles.privacyBody}>
            {t('onboarding.weather.privacy')}
          </AppText>
          <View style={styles.learnMore}>
            <Button
              variant="link"
              label={t('onboarding.weather.learnMore')}
              onPress={() => setPrivacyVisible(true)}
            />
          </View>
        </View>
      </View>
      <LocationBlockedScreen
        visible={blockedVisible}
        onManual={() => setBlockedVisible(false)}
      />
      <ConfirmDialog
        visible={privacyVisible}
        icon="lock-closed-outline"
        title={t('onboarding.weather.privacyTitle')}
        message={t('onboarding.weather.privacyDetails')}
        confirmLabel={t('onboarding.weather.understood')}
        onConfirm={() => setPrivacyVisible(false)}
        onCancel={() => setPrivacyVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  // Full width, starting behind the end of the introduction (the clouds).
  photo: { marginHorizontal: -spacing.xl, marginTop: -spacing.xl },
  overPhoto: { marginTop: -spacing.xxxl },
  city: { gap: spacing.lg },
  refusal: { gap: spacing.xs },
  privacy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  privacyText: { flex: 1 },
  privacyBody: { fontSize: 14, lineHeight: 19, color: colors.muted },
  learnMore: { alignSelf: 'center', marginLeft: -spacing.xxl },
});
