import {
  SEASONS,
  STYLES,
  WARDROBE_SORTS,
  WARDROBE_STATUSES,
  type ColorKey,
  type Season,
  type Style,
  type WardrobeSort,
  type WardrobeStatus,
} from '@klotho/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { spacing } from '@/theme/tokens';

export interface SheetFilters {
  color: ColorKey[];
  season: Season[];
  style: Style[];
  status: WardrobeStatus[];
  sort: WardrobeSort;
}

export const EMPTY_SHEET_FILTERS: SheetFilters = {
  color: [],
  season: [],
  style: [],
  status: [],
  sort: 'recent',
};

export function countActiveFilters(filters: SheetFilters): number {
  return (
    filters.color.length +
    filters.season.length +
    filters.style.length +
    filters.status.length +
    (filters.sort === 'recent' ? 0 : 1)
  );
}

interface FiltersSheetProps {
  visible: boolean;
  value: SheetFilters;
  onApply: (filters: SheetFilters) => void;
  onClose: () => void;
}

/**
 * Edits a draft; nothing changes in the list until "Appliquer".
 * The parent remounts it on each opening (key) so the draft starts from the applied filters.
 */
export function FiltersSheet({
  visible,
  value,
  onApply,
  onClose,
}: FiltersSheetProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);

  const set = <K extends keyof SheetFilters>(key: K, next: SheetFilters[K]) =>
    setDraft((current) => ({ ...current, [key]: next }));

  return (
    <BottomSheet
      visible={visible}
      title={t('wardrobe.filters.title')}
      onClose={onClose}
      footer={
        <>
          <View style={styles.flex}>
            <Button
              variant="secondary"
              label={t('wardrobe.filters.reset')}
              onPress={() => setDraft(EMPTY_SHEET_FILTERS)}
            />
          </View>
          <View style={styles.flex}>
            <Button
              label={t('wardrobe.filters.apply')}
              decorated={false}
              onPress={() => onApply(draft)}
            />
          </View>
        </>
      }
    >
      <View style={styles.section}>
        <SectionTitle title={t('wardrobe.filters.sort')} />
        <ChipGroup
          options={WARDROBE_SORTS.map((sort) => ({
            value: sort,
            label: t(`wardrobe.sorts.${sort}`),
          }))}
          value={draft.sort}
          onChange={(sort) => set('sort', sort ?? 'recent')}
        />
      </View>
      <View style={styles.section}>
        <SectionTitle title={t('wardrobe.form.primaryColor')} />
        <ColorPicker
          multiple
          value={draft.color}
          onChange={(color) => set('color', color)}
        />
      </View>
      <View style={styles.section}>
        <SectionTitle title={t('wardrobe.form.seasons')} />
        <ChipGroup<Season>
          multiple
          options={SEASONS.map((season) => ({
            value: season,
            label: t(`wardrobe.seasons.${season}`),
          }))}
          value={draft.season}
          onChange={(season) => set('season', season)}
        />
      </View>
      <View style={styles.section}>
        <SectionTitle title={t('wardrobe.form.styles')} />
        <ChipGroup<Style>
          multiple
          collapsedCount={9}
          options={STYLES.map((style) => ({
            value: style,
            label: t(`wardrobe.styles.${style}`),
          }))}
          value={draft.style}
          onChange={(style) => set('style', style)}
        />
      </View>
      <View style={styles.section}>
        <SectionTitle title={t('wardrobe.detail.availability')} />
        <ChipGroup<WardrobeStatus>
          multiple
          options={WARDROBE_STATUSES.map((status) => ({
            value: status,
            label: t(`wardrobe.statuses.${status}`),
          }))}
          value={draft.status}
          onChange={(status) => set('status', status)}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  flex: { flex: 1 },
});
