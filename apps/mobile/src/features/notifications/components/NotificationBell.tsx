import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

import { useUnreadCount } from '../hooks/useNotifications';

/** The bell of the header, with a dot while something is unread. */
export function NotificationBell() {
  const { t } = useTranslation();
  const unread = useUnreadCount().data ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unread > 0
          ? t('notifications.openUnread', { count: unread })
          : t('notifications.open')
      }
      onPress={() => router.push('/notifications')}
      hitSlop={8}
      style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
    >
      <Ionicons name="notifications-outline" size={26} color={colors.primary} />
      {unread > 0 && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bell: { padding: 4 },
  pressed: { opacity: 0.7 },
  dot: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: colors.background,
    backgroundColor: colors.primary,
  },
});
