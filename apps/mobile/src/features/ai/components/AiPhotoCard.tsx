import { Ionicons } from '@expo/vector-icons';
import type { WardrobePhotoAnalysis } from '@klotho/shared';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import type { LocalPhoto } from '@/features/wardrobe/photos/pick-photo';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { useAiCredits, useAnalyzePhoto } from '../hooks/useAi';

/**
 * "Remplir avec Klotho IA", under the photos of a new piece: analyses the
 * main photo. Hidden when the server has no AI.
 */
export function AiPhotoCard({
  photo,
  onAnalyzed,
}: {
  photo: LocalPhoto;
  onAnalyzed: (analysis: WardrobePhotoAnalysis) => void;
}) {
  const { t } = useTranslation();
  const credits = useAiCredits();
  const analyze = useAnalyzePhoto();

  if (!credits.data?.enabled) return null;
  const { remaining } = credits.data;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
        </View>
        <View style={styles.titles}>
          <AppText variant="heading" style={styles.title}>
            {t('ai.card.title')}
          </AppText>
          <AppText variant="hint">
            {t('ai.card.remaining', { count: remaining })}
          </AppText>
        </View>
      </View>
      <AppText style={styles.body}>
        {remaining > 0 ? t('ai.card.body') : t('ai.card.none')}
      </AppText>
      <FormError
        message={
          analyze.error
            ? t(errorMessageKey(analyze.error) as 'apiErrors.unknown')
            : null
        }
      />
      {remaining > 0 && (
        <>
          <Button
            icon="sparkles-outline"
            decorated={false}
            label={t('ai.card.action')}
            loading={analyze.isPending}
            onPress={() => analyze.mutate(photo, { onSuccess: onAnalyzed })}
          />
          <AppText variant="hint" center>
            {t('ai.card.privacy')}
          </AppText>
        </>
      )}
      <AnalyzingModal visible={analyze.isPending} photo={photo} />
    </View>
  );
}

function AnalyzingModal({
  visible,
  photo,
}: {
  visible: boolean;
  photo: LocalPhoto;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // The analysis cannot be cancelled: the back button waits.
      }}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.analyzing}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.frame}>
            <Image
              source={{ uri: photo.uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.veil}>
              <ActivityIndicator size="large" color={colors.onPrimary} />
            </View>
          </View>
          <AppText variant="title" center style={styles.analyzingTitle}>
            {t('ai.analyzing.title')}
          </AppText>
          <AppText center>{t('ai.analyzing.body')}</AppText>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  titles: { flex: 1, gap: 2 },
  title: { fontSize: 20, lineHeight: 25 },
  body: { fontFamily: fonts.serifRegular, fontSize: 16, lineHeight: 22 },
  safe: { flex: 1, backgroundColor: colors.background },
  analyzing: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  frame: {
    alignSelf: 'center',
    width: '70%',
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    borderRadius: radii.card,
    backgroundColor: colors.input,
  },
  veil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(62, 35, 28, 0.25)',
  },
  analyzingTitle: { fontSize: 28, lineHeight: 33 },
});
