import Slider from '@react-native-community/slider';
import {
  displayTemperature,
  SEASONS,
  STYLES,
  WARDROBE_CATEGORIES,
  WARDROBE_SORTS,
  WARDROBE_STATUSES,
  type ColorKey,
  type Season,
  type Style,
  type WardrobeCategory,
  type WardrobeSort,
  type WardrobeStatus,
} from '@klotho/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useWeatherSettings } from '@/features/weather/hooks/useWeatherSettings';
import {
  categoryIcons,
  seasonIcons,
  statusIcons,
  styleIcons,
} from '@/theme/icons';
import { colors, fonts, spacing } from '@/theme/tokens';

export interface SheetFilters {
  category: WardrobeCategory[];
  color: ColorKey[];
  season: Season[];
  style: Style[];
  status: WardrobeStatus[];
  /** Wearable at this temperature (°C), or no temperature filter. */
  temperature: number | null;
  sort: WardrobeSort;
}

export const EMPTY_SHEET_FILTERS: SheetFilters = {
  category: [],
  color: [],
  season: [],
  style: [],
  status: [],
  temperature: null,
  sort: 'recent',
};

/** Filters hidden in the sheet (the categories also show on the screen). */
export function countActiveFilters(filters: SheetFilters): number {
  return (
    filters.color.length +
    filters.season.length +
    filters.style.length +
    filters.status.length +
    (filters.temperature === null ? 0 : 1) +
    (filters.sort === 'recent' ? 0 : 1)
  );
}

/** Range of the mockup slider, in °C. */
const TEMPERATURE_RANGE = { min: -5, max: 30 };
const TEMPERATURE_TICKS = [-5, 0, 5, 10, 15, 20, 25, 30];

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
  const unit = useWeatherSettings().data?.temperatureUnit ?? 'celsius';
  const symbol = unit === 'fahrenheit' ? '°F' : '°C';

  const set = <K extends keyof SheetFilters>(key: K, next: SheetFilters[K]) =>
    setDraft((current) => ({ ...current, [key]: next }));

  return (
    <BottomSheet
      visible={visible}
      title={t('wardrobe.filters.title')}
      overline={t('wardrobe.filters.overline')}
      onClose={onClose}
      footer={
        <>
          <View style={styles.flex}>
            <Button
              variant="secondary"
              icon="refresh"
              label={t('wardrobe.filters.reset')}
              onPress={() => setDraft(EMPTY_SHEET_FILTERS)}
            />
          </View>
          <View style={styles.flex}>
            <Button
              label={t('wardrobe.filters.apply')}
              onPress={() => onApply(draft)}
            />
          </View>
        </>
      }
    >
      <View style={styles.section}>
        <SectionTitle
          variant="heading"
          title={t('wardrobe.filters.categories')}
        />
        <ChipGroup<WardrobeCategory>
          multiple
          scroll
          options={WARDROBE_CATEGORIES.map((category) => ({
            value: category,
            label: t(`wardrobe.categories.${category}`),
            icon: categoryIcons[category],
          }))}
          value={draft.category}
          onChange={(category) => set('category', category)}
        />
      </View>
      <View style={styles.section}>
        <SectionTitle variant="heading" title={t('wardrobe.filters.colors')} />
        <ColorPicker
          multiple
          compactCount={4}
          value={draft.color}
          onChange={(color) => set('color', color)}
        />
      </View>
      <View style={styles.section}>
        <SectionTitle variant="heading" title={t('wardrobe.filters.styles')} />
        <ChipGroup<Style>
          multiple
          scroll
          options={STYLES.map((style) => ({
            value: style,
            label: t(`wardrobe.styles.${style}`),
            icon: styleIcons[style],
          }))}
          value={draft.style}
          onChange={(style) => set('style', style)}
        />
      </View>
      <View style={styles.section}>
        <SectionTitle variant="heading" title={t('wardrobe.filters.seasons')} />
        <ChipGroup<Season>
          multiple
          scroll
          options={SEASONS.map((season) => ({
            value: season,
            label: t(`wardrobe.seasons.${season}`),
            icon: seasonIcons[season],
          }))}
          value={draft.season}
          onChange={(season) => set('season', season)}
        />
      </View>
      <View style={styles.section}>
        <View style={styles.temperatureTitle}>
          <SectionTitle
            variant="heading"
            title={t('wardrobe.filters.temperature')}
          />
          <AppText style={styles.temperatureValue}>
            {draft.temperature === null
              ? t('wardrobe.filters.anyTemperature')
              : `${displayTemperature(draft.temperature, unit)}${symbol}`}
          </AppText>
        </View>
        <Slider
          accessibilityLabel={t('wardrobe.filters.temperature')}
          minimumValue={TEMPERATURE_RANGE.min}
          maximumValue={TEMPERATURE_RANGE.max}
          step={1}
          value={draft.temperature ?? TEMPERATURE_RANGE.min}
          onValueChange={(temperature) => set('temperature', temperature)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          testID="temperature-slider"
        />
        <View
          style={styles.ticks}
          importantForAccessibility="no-hide-descendants"
        >
          {TEMPERATURE_TICKS.map((tick) => (
            <AppText key={tick} variant="hint">
              {`${displayTemperature(tick, unit)}°`}
            </AppText>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <SectionTitle
          variant="heading"
          title={t('wardrobe.detail.availability')}
        />
        <ChipGroup<WardrobeStatus>
          multiple
          scroll
          options={WARDROBE_STATUSES.map((status) => ({
            value: status,
            label: t(`wardrobe.statuses.${status}`),
            icon: statusIcons[status],
          }))}
          value={draft.status}
          onChange={(status) => set('status', status)}
        />
      </View>
      <View style={styles.section}>
        <SectionTitle variant="heading" title={t('wardrobe.filters.sort')} />
        <ChipGroup
          scroll
          options={WARDROBE_SORTS.map((sort) => ({
            value: sort,
            label: t(`wardrobe.sorts.${sort}`),
          }))}
          value={draft.sort}
          onChange={(sort) => set('sort', sort ?? 'recent')}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  flex: { flex: 1 },
  temperatureTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  temperatureValue: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.title,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: -spacing.sm,
  },
});
