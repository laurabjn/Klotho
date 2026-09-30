import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing, touchTarget } from '@/theme/tokens';

import { AppText } from './AppText';

interface BottomSheetProps {
  visible: boolean;
  title: string;
  /** Spaced capitals under the title ("AFFINEZ VOTRE SÉLECTION"). */
  overline?: string;
  onClose: () => void;
  children: ReactNode;
  /** Sticky actions under the scrollable content. */
  footer?: ReactNode;
}

/**
 * Sheet sliding from the bottom, with a grab handle, the title on the left
 * and a round close button, as in the "Filtres" mockup.
 */
export function BottomSheet({
  visible,
  title,
  overline,
  onClose,
  children,
  footer,
}: BottomSheetProps) {
  const { t } = useTranslation();
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
          <View style={styles.header}>
            <View style={styles.titles}>
              <AppText variant="title">{title}</AppText>
              {overline && <AppText variant="overline">{overline}</AppText>}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              hitSlop={4}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={24} color={colors.title} />
            </Pressable>
          </View>
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
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titles: { flex: 1, gap: spacing.xs },
  close: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  pressed: { opacity: 0.7 },
  content: { gap: spacing.xl, paddingVertical: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.md },
});
