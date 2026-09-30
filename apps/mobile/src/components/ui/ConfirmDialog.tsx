import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
}

/** Branded replacement for Alert.alert (the native dialog cannot be styled). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  icon,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        {/* Tapping outside the card cancels, like the Android back button. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <View style={styles.card} accessibilityViewIsModal>
          {icon && (
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={26} color={colors.primary} />
            </View>
          )}
          <AppText variant="heading" center style={styles.title}>
            {title}
          </AppText>
          <AppText center>{message}</AppText>
          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              decorated={false}
              loading={loading}
              onPress={onConfirm}
            />
            <Button variant="link" label={cancelLabel} onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: 'rgba(62, 35, 28, 0.4)',
  },
  card: {
    alignItems: 'stretch',
    gap: spacing.md,
    padding: spacing.xxl,
    borderRadius: radii.card + 4,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconCircle: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  title: { fontSize: 26, lineHeight: 32 },
  actions: { marginTop: spacing.md, gap: spacing.xs },
});
