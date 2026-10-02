import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { AppNotification } from '@klotho/shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { useMarkRead } from '../hooks/useNotifications';
import { describeNotification, timeAgo } from '../lib/notification-text';

/** One notification, as on the mockup: icon, words, time, photo. */
export function NotificationCard({
  notification,
}: {
  notification: AppNotification;
}) {
  const { t } = useTranslation();
  const markRead = useMarkRead();
  const view = describeNotification(t, notification);
  const open = () => {
    if (!notification.read) markRead.mutate(notification.id);
    router.push(view.route);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        view.title,
        notification.read ? null : t('notifications.unread'),
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint={view.body}
      onPress={open}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View>
        <View style={styles.icon}>
          <MaterialCommunityIcons
            name={view.icon}
            size={24}
            color={colors.primary}
          />
        </View>
        {!notification.read && <View style={styles.dot} />}
      </View>
      <View style={styles.text}>
        <AppText style={styles.title}>{view.title}</AppText>
        <AppText variant="hint" style={styles.body}>
          {view.body}
        </AppText>
        <AppText variant="hint" style={styles.time}>
          {timeAgo(t, notification.createdAt)}
        </AppText>
      </View>
      {notification.data.imageUrl && (
        <Image
          source={{ uri: notification.data.imageUrl }}
          style={styles.photo}
          contentFit="cover"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  text: { flex: 1, gap: 4 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 18,
    lineHeight: 22,
    color: colors.title,
  },
  body: { fontSize: 14, lineHeight: 19 },
  time: { fontSize: 12 },
  photo: { width: 72, height: 88, borderRadius: radii.input },
});
