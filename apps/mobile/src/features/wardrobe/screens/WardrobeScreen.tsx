import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  WARDROBE_CATEGORIES,
  type WardrobeCategory,
  type WardrobeItem,
} from '@klotho/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineState } from '@/components/ui/OfflineState';
import { ScrollToTopButton, useScrollToTop } from '@/components/ui/ScrollToTop';
import { StateView } from '@/components/ui/StateView';
import { errorMessageKey, NetworkError } from '@/lib/api/errors';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { categoryIcons } from '@/theme/icons';
import { statePhotos } from '@/theme/photos';
import { useCompactLayout } from '@/theme/useCompactLayout';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

import {
  countActiveFilters,
  EMPTY_SHEET_FILTERS,
  FiltersSheet,
  type SheetFilters,
} from '../components/FiltersSheet';
import { WardrobeItemCard } from '../components/WardrobeItemCard';
import {
  useWardrobeList,
  type WardrobeListFilters,
} from '../hooks/useWardrobe';

export function WardrobeScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sheetFilters, setSheetFilters] =
    useState<SheetFilters>(EMPTY_SHEET_FILTERS);
  const [sheetVisible, setSheetVisible] = useState(false);
  const { scrollRef, onScroll, showTop, scrollToTop } =
    useScrollToTop<FlatList<WardrobeItem>>();
  const q = useDebouncedValue(search.trim());
  const columns = useCompactLayout() ? 2 : 3;

  const filters = useMemo<WardrobeListFilters>(() => {
    const { temperature, ...rest } = sheetFilters;
    return {
      ...rest,
      ...(temperature !== null && { temperature }),
      ...(q && { q }),
    };
  }, [sheetFilters, q]);
  const categories = sheetFilters.category;
  // The chips of the screen pick one category; the sheet can pick several.
  const setCategory = (category: WardrobeCategory | null) =>
    setSheetFilters((current) => ({
      ...current,
      category: category ? [category] : [],
    }));
  const list = useWardrobeList(filters);

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;
  const activeFilters = countActiveFilters(sheetFilters);
  const isFiltered = activeFilters > 0 || categories.length > 0 || q !== '';
  // Nothing to search nor filter in an empty wardrobe.
  const isEmpty = list.isSuccess && total === 0 && !isFiltered;

  const clearFilters = () => {
    setSearch('');
    setSheetFilters(EMPTY_SHEET_FILTERS);
  };

  const header = (
    <View style={styles.header}>
      <AppHeader />
      <View style={styles.titleRow}>
        <View style={styles.titles}>
          <AppText variant="title">{t('wardrobe.title')}</AppText>
          <AppText variant="overline">{t('wardrobe.overline')}</AppText>
        </View>
        {list.isSuccess && total > 0 && (
          <View style={styles.count} accessibilityLiveRegion="polite">
            <MaterialCommunityIcons
              name="bag-personal-outline"
              size={18}
              color={colors.title}
            />
            <AppText style={styles.countText}>
              {t('wardrobe.count', { count: total })}
            </AppText>
          </View>
        )}
      </View>
      {!isEmpty && (
        <>
          <View style={styles.searchRow}>
            <View style={styles.search}>
              <Ionicons name="search-outline" size={20} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('wardrobe.searchPlaceholder')}
                placeholderTextColor={colors.placeholder}
                accessibilityLabel={t('wardrobe.searchPlaceholder')}
                returnKeyType="search"
                maxFontSizeMultiplier={1.2}
                style={styles.searchInput}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                activeFilters
                  ? `${t('wardrobe.filters.open')}, ${t('wardrobe.filters.active', { count: activeFilters })}`
                  : t('wardrobe.filters.open')
              }
              onPress={() => setSheetVisible(true)}
              style={[
                styles.filterButton,
                activeFilters > 0 && styles.filterButtonActive,
              ]}
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={22}
                color={activeFilters > 0 ? colors.onPrimary : colors.title}
              />
              {activeFilters > 0 && (
                <View style={styles.filterCount}>
                  <AppText variant="hint" style={styles.filterCountText}>
                    {activeFilters}
                  </AppText>
                </View>
              )}
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categories}
          >
            <Chip
              label={t('wardrobe.all')}
              icon="view-grid-outline"
              selected={categories.length === 0}
              onPress={() => setCategory(null)}
            />
            {WARDROBE_CATEGORIES.map((value) => (
              <Chip
                key={value}
                label={t(`wardrobe.categories.${value}`)}
                icon={categoryIcons[value]}
                selected={categories.includes(value)}
                onPress={() =>
                  setCategory(
                    categories.length === 1 && categories[0] === value
                      ? null
                      : value,
                  )
                }
              />
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (list.isPending) {
      return <ActivityIndicator style={styles.loader} color={colors.primary} />;
    }
    if (list.isError) {
      return list.error instanceof NetworkError ? (
        <OfflineState
          onRetry={() => void list.refetch()}
          retrying={list.isRefetching}
        />
      ) : (
        <EmptyState
          icon="cloud-offline-outline"
          title={t('wardrobe.loadError')}
          body={t(errorMessageKey(list.error) as 'apiErrors.unknown')}
          actionLabel={t('common.retry')}
          onAction={() => void list.refetch()}
        />
      );
    }
    if (isFiltered) {
      return (
        <StateView
          image={statePhotos.search}
          imageRatio={1.8}
          title={t('states.noResult.title')}
          body={
            q
              ? t('states.noResult.body', { query: q })
              : t('states.noResult.bodyFilters')
          }
          primary={{ label: t('states.noResult.clear'), onPress: clearFilters }}
        />
      );
    }
    return (
      <StateView
        image={statePhotos.emptyWardrobe}
        title={t('states.emptyWardrobe.title')}
        body={t('states.emptyWardrobe.body')}
        primary={{
          label: t('states.emptyWardrobe.add'),
          onPress: () => router.push('/piece/new'),
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={100}
        data={items}
        keyExtractor={(item) => item.id}
        // FlatList needs a new instance when the number of columns changes.
        key={columns}
        numColumns={columns}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <View style={[styles.cell, { maxWidth: `${100 / columns}%` }]}>
            <WardrobeItemCard
              item={item}
              onPress={() => router.push(`/piece/${item.id}`)}
            />
          </View>
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage)
            void list.fetchNextPage();
        }}
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isFetchingNextPage}
            onRefresh={() => void list.refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        keyboardShouldPersistTaps="handled"
      />
      {(total > 0 || isFiltered) && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('wardrobe.add')}
          onPress={() => router.push('/piece/new')}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Ionicons name="add" size={30} color={colors.onPrimary} />
        </Pressable>
      )}
      <ScrollToTopButton
        visible={showTop}
        onPress={scrollToTop}
        // Above the "add" button, centred on it.
        bottom={spacing.xl + 60 + spacing.md}
        right={spacing.xl + 6}
      />
      <FiltersSheet
        key={sheetVisible ? 'open' : 'closed'}
        visible={sheetVisible}
        value={sheetFilters}
        onClose={() => setSheetVisible(false)}
        onApply={(next) => {
          setSheetFilters(next);
          setSheetVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 110,
    gap: spacing.md,
  },
  header: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titles: { flex: 1, gap: spacing.xs },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.input,
    backgroundColor: colors.input,
  },
  countText: { fontFamily: fonts.serif, fontSize: 16, color: colors.title },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  search: {
    flex: 1,
    minHeight: touchTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  searchInput: {
    flex: 1,
    // Full height of the bar: Android otherwise clips the tall serif glyphs
    // of the placeholder (Cormorant has long ascenders and descenders).
    alignSelf: 'stretch',
    paddingVertical: 0,
    textAlignVertical: 'center',
    fontFamily: fonts.serifRegular,
    fontSize: 16,
    color: colors.title,
  },
  filterButton: {
    width: touchTarget + 4,
    height: touchTarget + 4,
    borderRadius: radii.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: { backgroundColor: colors.primary },
  filterCount: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.title,
  },
  filterCountText: { color: colors.onPrimary, fontSize: 11, lineHeight: 14 },
  // Full-bleed line, scrolling under the screen edges.
  categoriesScroll: { marginHorizontal: -spacing.lg },
  categories: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  columns: { gap: spacing.sm },
  cell: { flex: 1 },
  loader: { marginTop: spacing.xxxl },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabPressed: { backgroundColor: colors.primaryPressed },
});
