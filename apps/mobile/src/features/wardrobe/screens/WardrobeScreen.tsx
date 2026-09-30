import { Ionicons } from '@expo/vector-icons';
import { WARDROBE_CATEGORIES, type WardrobeCategory } from '@klotho/shared';
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

import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

import {
  countActiveFilters,
  EMPTY_SHEET_FILTERS,
  FiltersSheet,
  type SheetFilters,
} from '../components/FiltersSheet';
import { WardrobeItemCard } from '../components/WardrobeItemCard';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  useWardrobeList,
  type WardrobeListFilters,
} from '../hooks/useWardrobe';

export function WardrobeScreen() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<WardrobeCategory | null>(null);
  const [search, setSearch] = useState('');
  const [sheetFilters, setSheetFilters] =
    useState<SheetFilters>(EMPTY_SHEET_FILTERS);
  const [sheetVisible, setSheetVisible] = useState(false);
  const q = useDebouncedValue(search.trim());

  const filters = useMemo<WardrobeListFilters>(
    () => ({
      ...sheetFilters,
      category: category ? [category] : [],
      ...(q && { q }),
    }),
    [sheetFilters, category, q],
  );
  const list = useWardrobeList(filters);

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;
  const activeFilters = countActiveFilters(sheetFilters);
  const isFiltered = activeFilters > 0 || category !== null || q !== '';

  const clearFilters = () => {
    setCategory(null);
    setSearch('');
    setSheetFilters(EMPTY_SHEET_FILTERS);
  };

  const header = (
    <View style={styles.header}>
      <AppText variant="title">{t('wardrobe.title')}</AppText>
      <AppText variant="overline">{t('wardrobe.overline')}</AppText>
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
          <Ionicons
            name="options-outline"
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
        contentContainerStyle={styles.categories}
      >
        <Chip
          label={t('wardrobe.all')}
          selected={category === null}
          onPress={() => setCategory(null)}
        />
        {WARDROBE_CATEGORIES.map((value) => (
          <Chip
            key={value}
            label={t(`wardrobe.categories.${value}`)}
            selected={category === value}
            onPress={() => setCategory(category === value ? null : value)}
          />
        ))}
      </ScrollView>
      {list.isSuccess && total > 0 && (
        <AppText variant="hint" accessibilityLiveRegion="polite">
          {t('wardrobe.count', { count: total })}
        </AppText>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (list.isPending) {
      return <ActivityIndicator style={styles.loader} color={colors.primary} />;
    }
    if (list.isError) {
      return (
        <EmptyState
          icon="cloud-offline-outline"
          title={t('wardrobe.loadError')}
          body={t('apiErrors.network')}
          actionLabel={t('common.retry')}
          onAction={() => void list.refetch()}
        />
      );
    }
    if (isFiltered) {
      return (
        <EmptyState
          icon="search-outline"
          title={t('wardrobe.noResult.title')}
          body={t('wardrobe.noResult.body')}
          actionLabel={t('wardrobe.noResult.clear')}
          onAction={clearFilters}
        />
      );
    }
    return (
      <EmptyState
        icon="shirt-outline"
        title={t('wardrobe.empty.title')}
        body={t('wardrobe.empty.body')}
        actionLabel={t('wardrobe.empty.action')}
        onAction={() => router.push('/piece/new')}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <View style={styles.cell}>
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
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  search: {
    flex: 1,
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.serifRegular,
    fontSize: 17,
    color: colors.title,
  },
  filterButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCC5BB',
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
  categories: { gap: spacing.sm, paddingRight: spacing.lg },
  columns: { gap: spacing.md },
  cell: { flex: 1, maxWidth: '50%' },
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
