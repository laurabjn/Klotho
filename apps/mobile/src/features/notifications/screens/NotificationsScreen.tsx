import type { AppNotification, NotificationCategory } from '@klotho/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollToTopButton, useScrollToTop } from '@/components/ui/ScrollToTop';
import { colors, spacing } from '@/theme/tokens';

import { NotificationCard } from '../components/NotificationCard';
import {
  useMarkAllRead,
  useNotificationPages,
  useUnreadCount,
} from '../hooks/useNotifications';

const CATEGORIES: NotificationCategory[] = ['all', 'outfits', 'dressing'];
const ICONS = {
  all: 'view-grid-outline',
  outfits: 'hanger',
  dressing: 'shopping-outline',
} as const;

/** "Notifications", as on the mockup. */
export function NotificationsScreen() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<NotificationCategory>('all');
  const list = useNotificationPages(category);
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const { scrollRef, onScroll, showTop, scrollToTop } =
    useScrollToTop<FlatList<AppNotification>>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* The button stays above the phone's navigation bar. */}
      <View style={styles.page}>
        <FlatList
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={100}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationCard notification={item} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <AppHeader />
              <ScreenHeader
                title={t('notifications.title')}
                overline={t('notifications.overline')}
              />
              <ChipGroup
                options={CATEGORIES.map((value) => ({
                  value,
                  label: t(`notifications.tabs.${value}`),
                  icon: ICONS[value],
                }))}
                value={category}
                onChange={(next) => next && setCategory(next)}
              />
              {(unread.data ?? 0) > 0 && (
                <View style={styles.markAll}>
                  <Button
                    variant="link"
                    decorated={false}
                    label={t('notifications.markAll')}
                    loading={markAll.isPending}
                    onPress={() => markAll.mutate()}
                  />
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            list.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <EmptyState
                icon="notifications-outline"
                title={t('notifications.emptyTitle')}
                body={t('notifications.emptyBody')}
              />
            )
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage)
              void list.fetchNextPage();
          }}
          contentContainerStyle={styles.content}
        />
        <ScrollToTopButton visible={showTop} onPress={scrollToTop} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1 },
  header: { gap: spacing.lg },
  markAll: { alignItems: 'flex-end', marginTop: -spacing.sm },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
