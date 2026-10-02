import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { photos } from '@/theme/photos';
import { colors, radii, spacing } from '@/theme/tokens';

/** "Tenue planifiée !", as on the mockup: medallion, words, two buttons. */
export function PlannedDialog({
  visible,
  title,
  overline,
  message,
  onSeeCalendar,
  onClose,
}: {
  visible: boolean;
  title: string;
  overline?: string;
  message: string;
  onSeeCalendar: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('outfits.planning.close')}
            onPress={onClose}
            hitSlop={8}
            style={styles.close}
          >
            <Ionicons name="close" size={22} color={colors.primary} />
          </Pressable>
          <Image
            source={photos.planned.source}
            style={[styles.art, { aspectRatio: photos.planned.ratio }]}
            contentFit="contain"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <AppText variant="title" center style={styles.title}>
            {title}
          </AppText>
          {overline && (
            <AppText variant="overline" center>
              {overline}
            </AppText>
          )}
          <AppText center style={styles.message}>
            {message}
          </AppText>
          <View style={styles.buttons}>
            <Button
              label={t('outfits.planning.seeCalendar')}
              onPress={onSeeCalendar}
            />
            <Button
              variant="secondary"
              decorated={false}
              label={t('outfits.planning.close')}
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(62, 35, 28, 0.35)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.background,
  },
  close: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  art: { width: '100%' },
  title: { fontSize: 32, lineHeight: 37 },
  message: { fontSize: 17, lineHeight: 24, marginTop: spacing.xs },
  buttons: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },
});
