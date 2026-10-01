import { Ionicons } from '@expo/vector-icons';
import type { OutfitWear } from '@klotho/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollToTopButton, useScrollToTop } from '@/components/ui/ScrollToTop';
import { startOfMonth, startOfWeek, today } from '@/lib/days';
import { colors, radii, spacing } from '@/theme/tokens';

import { WornOutfitRow } from '../components/WornOutfitRow';
import { useWearHistory } from '../hooks/useOutfits';

export type HistoryPeriod = 'today' | 'week' | 'month' | 'older';

/** Which section of the history a day falls in (relative to `now`). */
export function periodOf(day: string, now: string): HistoryPeriod {
  if (day === now) return 'today';
  if (day >= startOfWeek(now)) return 'week';
  if (day >= startOfMonth(now)) return 'month';
  return 'older';
}

type Row =
  | { kind: 'section'; period: HistoryPeriod }
  | { kind: 'wear'; wear: OutfitWear };

/** "Historique de mes tenues": by day, week and month, page after page. */
export function OutfitHistoryScreen() {
  const { t } = useTranslation();
  const history = useWearHistory();
  const [collapsed, setCollapsed] = useState<HistoryPeriod[]>([]);
  const { scrollRef, onScroll, showTop, scrollToTop } =
    useScrollToTop<FlatList<Row>>();

  const now = today();
  const wears = history.data?.pages.flatMap((page) => page.items) ?? [];
  const rows: Row[] = [];
  let current: HistoryPeriod | null = null;
  for (const wear of wears) {
    const period = periodOf(wear.wornOn, now);
    if (period !== current) {
      rows.push({ kind: 'section', period });
      current = period;
    }
    if (!collapsed.includes(period)) rows.push({ kind: 'wear', wear });
  }

  const toggle = (period: HistoryPeriod) =>
    setCollapsed((list) =>
      list.includes(period)
        ? list.filter((p) => p !== period)
        : [...list, period],
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* The button stays above the phone's navigation bar. */}
      <View style={styles.page}>
        <FlatList
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={100}
          data={rows}
          keyExtractor={(row) =>
            row.kind === 'section' ? `section-${row.period}` : row.wear.id
          }
          renderItem={({ item: row }) =>
            row.kind === 'section' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  expanded: !collapsed.includes(row.period),
                }}
                onPress={() => toggle(row.period)}
                style={styles.section}
              >
                <AppText variant="overline" style={styles.sectionText}>
                  {t(`outfits.history.${row.period}`)}
                </AppText>
                <Ionicons
                  name={
                    collapsed.includes(row.period)
                      ? 'chevron-forward'
                      : 'chevron-down'
                  }
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
            ) : (
              <WornOutfitRow wear={row.wear} />
            )
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <AppHeader />
              <ScreenHeader
                title={t('outfits.history.title')}
                overline={t('outfits.history.overline')}
              />
            </View>
          }
          ListEmptyComponent={
            history.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <EmptyState
                icon="calendar-clear-outline"
                title={t('outfits.history.emptyTitle')}
                body={t('outfits.history.emptyBody')}
                actionLabel={t('home.generate')}
                onAction={() => router.navigate('/inspirations')}
              />
            )
          }
          ListFooterComponent={
            history.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} />
            ) : null
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (history.hasNextPage && !history.isFetchingNextPage)
              void history.fetchNextPage();
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
  header: { gap: spacing.lg, marginBottom: spacing.xs },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.input,
    backgroundColor: colors.input,
  },
  sectionText: { color: colors.title },
});
