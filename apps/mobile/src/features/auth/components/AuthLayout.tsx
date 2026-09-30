import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { KlothoBrandRow } from '@/components/brand/KlothoLogo';
import {
  ScrollToFocusedInputContext,
  useScrollToFocusedInput,
} from '@/components/ui/useScrollToFocusedInput';
import { colors, radii, spacing, touchTarget } from '@/theme/tokens';

interface AuthLayoutProps {
  /** Title block, rendered over the decorative area (where the mockups show a photo). */
  header: ReactNode;
  /** Form, rendered in the rounded bottom sheet. */
  children: ReactNode;
  centeredBrand?: boolean;
  showBack?: boolean;
}

export function AuthLayout({
  header,
  children,
  centeredBrand = false,
  showBack = false,
}: AuthLayoutProps) {
  const { t } = useTranslation();
  // The sheet background runs under the system navigation bar (edge-to-edge),
  // but its content must stay above it.
  const { bottom } = useSafeAreaInsets();
  const { scrollRef, contentRef, onFieldFocus } = useScrollToFocusedInput();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={[colors.primaryLight, colors.background]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Android is edge-to-edge: the window no longer resizes for the keyboard. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View ref={contentRef} style={styles.flex} collapsable={false}>
            <View style={styles.top}>
              <KlothoBrandRow centered={centeredBrand} />
              {showBack && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back')}
                  onPress={() =>
                    router.canGoBack()
                      ? router.back()
                      : router.replace('/login')
                  }
                  style={styles.back}
                >
                  <Ionicons
                    name="chevron-back"
                    size={22}
                    color={colors.title}
                  />
                </Pressable>
              )}
              <View style={styles.header}>{header}</View>
            </View>
            <View
              style={[styles.sheet, { paddingBottom: spacing.xxl + bottom }]}
            >
              <ScrollToFocusedInputContext value={onFieldFocus}>
                {children}
              </ScrollToFocusedInputContext>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  top: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  back: {
    width: touchTarget,
    height: touchTarget,
    marginTop: spacing.lg,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  header: { marginTop: spacing.xxl, gap: spacing.md },
  sheet: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
});
