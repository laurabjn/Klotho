import {
  OUTFIT_LIST_FILTERS,
  type Outfit,
  type OutfitListFilter,
} from '@klotho/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollToTopButton, useScrollToTop } from '@/components/ui/ScrollToTop';
import { colors, spacing } from '@/theme/tokens';

import { SavedOutfitCard } from '../components/SavedOutfitCard';
import { useOutfitPages } from '../hooks/useOutfits';

const isFilter = (value: unknown): value is OutfitListFilter =>
  OUTFIT_LIST_FILTERS.includes(value as OutfitListFilter);

/** "Mes favoris" (and the other saved looks: worn, all). */
export function MyOutfitsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ filter?: string }>();
  // "Mes favoris" by default; the worn and generated looks on demand.
  const filter: OutfitListFilter = isFilter(params.filter)
    ? params.filter
    : 'favorites';
  const list = useOutfitPages(filter);
  const outfits = list.data?.pages.flatMap((page) => page.items) ?? [];
  const { scrollRef, onScroll, showTop, scrollToTop } =
    useScrollToTop<FlatList<Outfit>>();

  const header = (
    <View style={styles.header}>
      <AppHeader />
      <ScreenHeader
        title={t(`outfits.mine.titles.${filter}`)}
        overline={t(`outfits.mine.overlines.${filter}`)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* The button stays above the phone's navigation bar. */}
      <View style={styles.page}>
        <FlatList
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={100}
          data={outfits}
          keyExtractor={(outfit) => outfit.id}
          renderItem={({ item }) => <SavedOutfitCard outfit={item} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            list.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <EmptyState
                icon={
                  filter === 'favorites' ? 'heart-outline' : 'shirt-outline'
                }
                title={t('outfits.mine.emptyTitle')}
                body={t(`outfits.mine.empty.${filter}`)}
                {...(filter === 'generated' && {
                  actionLabel: t('home.generate'),
                  onAction: () => router.navigate('/inspirations'),
                })}
              />
            )
          }
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} />
            ) : null
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
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
