import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { useLatestUnread, useMarkRead } from '../hooks/useNotifications';
import { describeNotification } from '../lib/notification-text';

/** The newest unread notification on Home ("5 nouvelles tenues générées"). */
export function NotificationBanner() {
  const { t } = useTranslation();
  const latest = useLatestUnread();
  const markRead = useMarkRead();
  if (!latest) return null;
  const view = describeNotification(t, latest);

  return (
    <View style={styles.banner}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={view.title}
        accessibilityHint={view.body}
        onPress={() => {
          markRead.mutate(latest.id);
          router.push(view.route);
        }}
        style={({ pressed }) => [styles.open, pressed && styles.pressed]}
      >
        <View style={styles.icon}>
          <MaterialCommunityIcons
            name={view.icon}
            size={24}
            color={colors.onPrimary}
          />
        </View>
        <View style={styles.text}>
          <View style={styles.row}>
            <Ionicons
              name="sparkles-outline"
              size={16}
              color={colors.primary}
            />
            <AppText style={styles.title} numberOfLines={2}>
              {view.title}
            </AppText>
          </View>
          <View style={styles.row}>
            <AppText variant="overline" numberOfLines={1} style={styles.body}>
              {view.body}
            </AppText>
            <Ionicons name="chevron-forward" size={14} color={colors.muted} />
          </View>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('notifications.close')}
        onPress={() => markRead.mutate(latest.id)}
        hitSlop={8}
        style={styles.close}
      >
        <Ionicons name="close" size={20} color={colors.title} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  open: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: { opacity: 0.8 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  text: { flex: 1, gap: 2 },
  title: {
    flexShrink: 1,
    fontFamily: fonts.serif,
    fontSize: 19,
    lineHeight: 23,
    color: colors.title,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  body: { flexShrink: 1 },
  close: { padding: 2 },
});
