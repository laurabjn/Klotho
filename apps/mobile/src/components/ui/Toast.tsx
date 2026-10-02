import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** How long a toast stays on screen. */
const VISIBLE_MS = 2500;
/** Room for the tab bar under it. */
const ABOVE_TABS = 72;

interface ToastState {
  message: string | null;
  icon: keyof typeof Ionicons.glyphMap;
  /** Changes on every toast, so that the same message restarts its timer. */
  key: number;
  show(message: string, icon?: keyof typeof Ionicons.glyphMap): void;
  hide(): void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  icon: 'heart',
  key: 0,
  show: (message, icon = 'heart') =>
    set((state) => ({ message, icon, key: state.key + 1 })),
  hide: () => set({ message: null }),
}));

/** "Tenue ajoutée aux favoris": a short confirmation, as on the mockup. */
export function showToast(
  message: string,
  icon?: keyof typeof Ionicons.glyphMap,
) {
  useToastStore.getState().show(message, icon);
}

export function Toast() {
  const { t } = useTranslation();
  const { message, icon, key, hide } = useToastStore();
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, key, hide]);

  if (!message) return null;
  return (
    <View
      style={[styles.toast, { bottom: bottom + ABOVE_TABS }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <AppText style={styles.text} numberOfLines={2}>
        {message}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('notifications.close')}
        onPress={hide}
        hitSlop={8}
      >
        <Ionicons name="close" size={20} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  text: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.onPrimary,
  },
});
