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
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollToTopButton, useScrollToTop } from '@/components/ui/ScrollToTop';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
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

const ALL = 'all';

/** "Mes pièces favorites", as on the mockup. */
export function FavoritePiecesScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sheetFilters, setSheetFilters] =
    useState<SheetFilters>(EMPTY_SHEET_FILTERS);
  const [sheetVisible, setSheetVisible] = useState(false);
  const q = useDebouncedValue(search.trim());

  const filters = useMemo<WardrobeListFilters>(() => {
    const { temperature, ...rest } = sheetFilters;
    return {
      ...rest,
      favorite: 'true',
      ...(temperature !== null && { temperature }),
      ...(q && { q }),
    };
  }, [sheetFilters, q]);
  const list = useWardrobeList(filters);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const columns = useCompactLayout() ? 2 : 3;
  const { scrollRef, onScroll, showTop, scrollToTop } =
    useScrollToTop<FlatList<WardrobeItem>>();

  // The chips pick one category; the sheet can pick several.
  const categories = sheetFilters.category;
  const category = categories.length === 1 ? categories[0]! : ALL;
  const setCategory = (next: WardrobeCategory | typeof ALL) =>
    setSheetFilters((current) => ({
      ...current,
      category: next === ALL ? [] : [next],
    }));
  const activeFilters = countActiveFilters(sheetFilters);
  const filtered = q !== '' || activeFilters > 0 || categories.length > 0;

  const header = (
    <View style={styles.header}>
      <AppHeader />
      <ScreenHeader
        title={t('wardrobe.favorites.title')}
        overline={t('wardrobe.favorites.overline')}
      />
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={20} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('wardrobe.favorites.search')}
            placeholderTextColor={colors.placeholder}
            accessibilityLabel={t('wardrobe.favorites.search')}
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
      <ChipGroup<WardrobeCategory | typeof ALL>
        options={[
          { value: ALL, label: t('wardrobe.favorites.all') },
          ...WARDROBE_CATEGORIES.map((value) => ({
            value,
            label: t(`wardrobe.categories.${value}`),
          })),
        ]}
        value={category}
        onChange={(next) => setCategory(next ?? ALL)}
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
          data={items}
          key={columns}
          numColumns={columns}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.columns}
          renderItem={({ item }) => (
            <View style={[styles.cell, { maxWidth: `${100 / columns}%` }]}>
              <WardrobeItemCard
                item={item}
                detail="category"
                onPress={() => router.push(`/piece/${item.id}`)}
              />
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            list.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : filtered ? (
              <EmptyState
                icon="search-outline"
                title={t('wardrobe.favorites.noResult')}
                body=""
              />
            ) : (
              <EmptyState
                icon="heart-outline"
                title={t('wardrobe.favorites.emptyTitle')}
                body={t('wardrobe.favorites.emptyBody')}
              />
            )
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage)
              void list.fetchNextPage();
          }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        />
        <ScrollToTopButton visible={showTop} onPress={scrollToTop} />
      </View>
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
  page: { flex: 1 },
  header: { gap: spacing.lg, marginBottom: spacing.sm },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  columns: { gap: spacing.sm },
  cell: { flex: 1 },
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
});
