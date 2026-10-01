import { Ionicons } from '@expo/vector-icons';
import {
  WARDROBE_CATEGORIES,
  type WardrobeCategory,
  type WardrobeItem,
} from '@klotho/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useWardrobeList } from '@/features/wardrobe/hooks/useWardrobe';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { categoryIcons } from '@/theme/icons';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';
import { useCompactLayout } from '@/theme/useCompactLayout';

import { OutfitItemTile } from '../components/OutfitItemTile';
import { useGenerationDraftStore } from '../store/generation-draft.store';

/** Pieces that can be imposed: never underwear. */
const CATEGORIES = WARDROBE_CATEGORIES.filter((c) => c !== 'UNDERWEAR');

/** "Choisir une pièce imposée": search and pick one available piece. */
export function PickMandatoryItemScreen() {
  const { t } = useTranslation();
  const current = useGenerationDraftStore((s) => s.mandatoryItem);
  const setMandatoryItem = useGenerationDraftStore((s) => s.setMandatoryItem);
  const [selected, setSelected] = useState<WardrobeItem | null>(current);
  const [category, setCategory] = useState<WardrobeCategory | null>(null);
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const columns = useCompactLayout() ? 2 : 3;

  const list = useWardrobeList({
    status: ['AVAILABLE'],
    category: category ? [category] : CATEGORIES,
    ...(q && { q }),
  });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  const choose = (item: WardrobeItem | null) => {
    setMandatoryItem(item);
    router.back();
  };

  const header = (
    <View style={styles.header}>
      <AppHeader />
      <ScreenHeader
        title={t('outfits.pick.title')}
        overline={t('outfits.pick.overline')}
      />
      <View style={styles.search}>
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('outfits.pick.search')}
          placeholderTextColor={colors.placeholder}
          accessibilityLabel={t('outfits.pick.search')}
          maxFontSizeMultiplier={1.2}
          style={styles.searchInput}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip
          label={t('outfits.pick.all')}
          selected={category === null}
          onPress={() => setCategory(null)}
        />
        {CATEGORIES.map((value) => (
          <Chip
            key={value}
            label={t(`wardrobe.categories.${value}`)}
            icon={categoryIcons[value]}
            selected={category === value}
            onPress={() => setCategory(value)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <FlatList
        key={columns}
        data={items}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={[styles.cell, { maxWidth: `${100 / columns}%` }]}>
            <OutfitItemTile
              item={item}
              selected={selected?.id === item.id}
              onPress={() => setSelected(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          list.isPending ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null
        }
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage)
            void list.fetchNextPage();
        }}
      />
      <View style={styles.footer}>
        <Button
          label={t('outfits.pick.submit')}
          disabled={!selected}
          onPress={() => choose(selected)}
        />
        {current && (
          <Button
            variant="link"
            label={t('outfits.pick.remove')}
            onPress={() => choose(null)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  search: {
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
  chips: { gap: spacing.sm },
  columns: { gap: spacing.sm },
  cell: { flex: 1 },
  loader: { marginTop: spacing.xxl },
  footer: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
