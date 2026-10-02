import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Without it, the dialog is a simple message with one button. */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  /** "danger": red icon and button, for what cannot be undone. */
  tone?: 'default' | 'danger';
  confirmDisabled?: boolean;
  /** Extra content under the message (a warning, a password field…). */
  children?: ReactNode;
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
  tone = 'default',
  confirmDisabled,
  children,
}: ConfirmDialogProps) {
  const danger = tone === 'danger';
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Tapping outside the card cancels, like the Android back button. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card} accessibilityViewIsModal>
            {icon && (
              <View style={[styles.iconCircle, danger && styles.dangerCircle]}>
                <Ionicons
                  name={icon}
                  size={26}
                  color={danger ? colors.error : colors.primary}
                />
              </View>
            )}
            <AppText variant="title" center style={styles.title}>
              {title}
            </AppText>
            <AppText center>{message}</AppText>
            {children}
            {/* Stacked: long labels ("Se déconnecter") stay full size. */}
            <View style={styles.actions}>
              <Button
                variant={danger ? 'danger' : 'primary'}
                label={confirmLabel}
                icon={danger ? undefined : 'sparkles'}
                decorated={false}
                loading={loading}
                disabled={confirmDisabled}
                onPress={onConfirm}
              />
              {cancelLabel && (
                <Button
                  variant="secondary"
                  label={cancelLabel}
                  onPress={onCancel}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
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
  scroll: { flexGrow: 0 },
  scrollContent: { padding: spacing.xl },
  dangerCircle: { backgroundColor: '#F6DEDA' },
  iconCircle: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  title: { fontSize: 30, lineHeight: 36 },
  actions: { marginTop: spacing.md, gap: spacing.md },
});
