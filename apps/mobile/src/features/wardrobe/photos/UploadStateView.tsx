import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, radii, spacing } from '@/theme/tokens';

import type { LocalPhoto } from './pick-photo';

export type UploadState =
  | { phase: 'sending'; share: number; total: number }
  | { phase: 'success' }
  | { phase: 'error' };

interface Action {
  label: string;
  onPress: () => void;
}

/**
 * The 3 "Upload photo" states of the mockups: the photo being sent with
 * its progress, then "Photo ajoutée !" or "Une erreur est survenue".
 */
export function UploadStateView({
  state,
  photo,
  primary,
  secondary,
}: {
  state: UploadState;
  photo: LocalPhoto | undefined;
  primary?: Action;
  secondary?: Action;
}) {
  const { t } = useTranslation();
  const percent =
    state.phase === 'sending' ? Math.round(state.share * 100) : 100;

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        {photo && (
          <Image
            source={{ uri: photo.uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        )}
        {state.phase !== 'sending' && (
          <View
            style={[styles.badge, state.phase === 'error' && styles.badgeError]}
          >
            <Ionicons
              name={state.phase === 'success' ? 'checkmark' : 'close'}
              size={30}
              color={colors.onPrimary}
            />
          </View>
        )}
      </View>

      {state.phase === 'sending' ? (
        <View style={styles.text} accessibilityLiveRegion="polite">
          <AppText variant="heading" center>
            {state.total > 1
              ? t('states.upload.sendingCount', {
                  done: Math.min(
                    Math.floor(state.share * state.total) + 1,
                    state.total,
                  ),
                  total: state.total,
                })
              : t('states.upload.sending')}
          </AppText>
          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: percent }}
          >
            <View style={[styles.bar, { width: `${percent}%` }]} />
          </View>
          <AppText center style={styles.percent}>
            {`${percent} %`}
          </AppText>
          <AppText variant="hint" center>
            {t('states.upload.keepOpen')}
          </AppText>
        </View>
      ) : (
        <View style={styles.text} accessibilityLiveRegion="polite">
          <AppText variant="title" center style={styles.title}>
            {state.phase === 'success'
              ? t('states.upload.successTitle')
              : t('states.upload.errorTitle')}
          </AppText>
          <AppText center>
            {state.phase === 'success'
              ? t('states.upload.successBody')
              : t('states.upload.errorBody')}
          </AppText>
        </View>
      )}

      {(primary || secondary) && (
        <View style={styles.actions}>
          {primary && (
            <Button
              decorated={false}
              label={primary.label}
              onPress={primary.onPress}
            />
          )}
          {secondary && (
            <Button
              variant="outline"
              decorated={false}
              label={secondary.label}
              onPress={secondary.onPress}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl },
  frame: {
    alignSelf: 'center',
    width: '70%',
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.onPrimary,
    backgroundColor: colors.primary,
  },
  badgeError: { backgroundColor: colors.error },
  text: { gap: spacing.md },
  title: { fontSize: 28, lineHeight: 33 },
  track: {
    height: 8,
    overflow: 'hidden',
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  bar: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  percent: { color: colors.primary },
  actions: { gap: spacing.sm },
});
