import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

interface BottomSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Sticky actions under the scrollable content. */
  footer?: ReactNode;
}

/** Sheet sliding from the bottom, with a grab handle, as in the "Filtres" mockup. */
export function BottomSheet({
  visible,
  title,
  onClose,
  children,
  footer,
}: BottomSheetProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <View
          style={[styles.sheet, { paddingBottom: spacing.lg + bottom }]}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />
          <AppText variant="heading" center>
            {title}
          </AppText>
          <ScrollView contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(62, 35, 28, 0.4)',
  },
  sheet: {
    maxHeight: '88%',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    backgroundColor: colors.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  content: { gap: spacing.xl, paddingVertical: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.md },
});
