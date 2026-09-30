import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
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

/** The ivory background, fully transparent (for the photo fades). */
const CLEAR = 'rgba(251, 247, 242, 0)';

interface AuthLayoutProps {
  /** Title block. */
  header: ReactNode;
  /** Form, rendered in the rounded bottom sheet. */
  children: ReactNode;
  photo: ImageSource;
  /**
   * "band": full-width photo between the title and the form (login, forgot
   * password). "side": photo on the right, behind the title (sign-up, new
   * password).
   */
  photoPlacement?: 'band' | 'side';
  /** Width / height of the photo file. */
  photoRatio: number;
  centeredBrand?: boolean;
  showBack?: boolean;
}

export function AuthLayout({
  header,
  children,
  photo,
  photoPlacement = 'band',
  photoRatio,
  centeredBrand = false,
  showBack = false,
}: AuthLayoutProps) {
  const { t } = useTranslation();
  // The sheet background runs under the system navigation bar (edge-to-edge),
  // but its content must stay above it.
  const { bottom } = useSafeAreaInsets();
  const { scrollRef, contentRef, onFieldFocus } = useScrollToFocusedInput();
  const side = photoPlacement === 'side';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Android is edge-to-edge: the window no longer resizes for the keyboard. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View ref={contentRef} style={styles.flex} collapsable={false}>
            {side && (
              <View
                style={[styles.sidePhoto, { aspectRatio: photoRatio }]}
                importantForAccessibility="no-hide-descendants"
              >
                <Image
                  source={photo}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={[colors.background, CLEAR]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.45, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={[CLEAR, colors.background]}
                  start={{ x: 0, y: 0.75 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            )}
            <View style={[styles.top, side && styles.topSide]}>
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
              <View style={[styles.header, side && styles.headerSide]}>
                {header}
              </View>
            </View>
            {!side && (
              <View
                style={[styles.band, { aspectRatio: photoRatio }]}
                importantForAccessibility="no-hide-descendants"
              >
                <Image
                  source={photo}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={[colors.background, CLEAR]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0.25 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            )}
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  topSide: { flexGrow: 1, paddingBottom: spacing.xxl },
  back: {
    width: touchTarget,
    height: touchTarget,
    marginTop: spacing.lg,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  header: { marginTop: spacing.lg, gap: spacing.md },
  // The text column leaves the right of the screen to the photo.
  headerSide: { width: '62%' },
  sidePhoto: { position: 'absolute', top: 0, right: 0, width: '56%' },
  band: { width: '100%', marginTop: -spacing.lg },
  sheet: {
    flexGrow: 1,
    gap: spacing.lg,
    marginTop: -radii.sheet,
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
