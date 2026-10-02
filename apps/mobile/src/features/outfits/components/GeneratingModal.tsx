import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
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
import { StateView } from '@/components/ui/StateView';
import { statePhotos } from '@/theme/photos';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

const STEPS = ['wardrobe', 'weather', 'match', 'finish'] as const;
const STEP_MS = 900;

/**
 * "Klotho crée tes tenues…": covers the screen while the engine works. The
 * steps only pace the wait (the API answers in one go); the last one stays
 * on until the answer comes.
 */
export function GeneratingModal({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // The generation cannot be cancelled: the back button waits.
      }}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          accessibilityLiveRegion="polite"
        >
          <StateView
            image={statePhotos.generating}
            imageRatio={1.1}
            title={t('states.generating.title')}
          >
            {/* Mounted with the modal: each generation starts at step 1. */}
            {visible && <Steps />}
            <AppText center style={styles.quote}>
              {t('states.generating.quote')}
            </AppText>
          </StateView>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Steps() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setStep((current) => Math.min(current + 1, STEPS.length - 1)),
      STEP_MS,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.steps}>
      {STEPS.map((key, index) => (
        <View key={key} style={styles.step}>
          {index < step ? (
            <View style={styles.done}>
              <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
            </View>
          ) : index === step ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.todo} />
          )}
          <AppText style={[styles.stepText, index > step && styles.later]}>
            {t(`states.generating.steps.${key}`)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  steps: {
    gap: spacing.md,
    alignSelf: 'center',
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  done: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  todo: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  stepText: { fontFamily: fonts.serif, fontSize: 17, color: colors.title },
  later: { color: colors.muted },
  quote: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: 17,
    color: colors.primary,
  },
});
