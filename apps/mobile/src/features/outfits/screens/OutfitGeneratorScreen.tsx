import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  OCCASIONS,
  STYLES,
  type ColorKey,
  type GenerateOutfitsInput,
  type Occasion,
  type Style,
  type WardrobeCategory,
} from '@klotho/shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { TemperatureSlider } from '@/components/ui/TemperatureSlider';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { useDailyStyle } from '@/features/home/store/daily-style.store';
import { useStyleProfile } from '@/features/preferences/hooks/useStyleProfile';
import { useWardrobeList } from '@/features/wardrobe/hooks/useWardrobe';
import { useCurrentWeather } from '@/features/weather/hooks/useCurrentWeather';
import { useManualTemperature } from '@/features/weather/store/manual-temperature.store';
import { errorMessageKey } from '@/lib/api/errors';
import { occasionIcons, styleIcons, type IconName } from '@/theme/icons';
import { occasionPhotos } from '@/theme/photos';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { OutfitItemTile } from '../components/OutfitItemTile';
import { useGenerateOutfits } from '../hooks/useOutfits';
import {
  WEATHER_CHOICES,
  weatherChoiceOf,
  type WeatherChoice,
} from '../lib/outfit-labels';
import { useGenerationDraftStore } from '../store/generation-draft.store';

const WEATHER_ICONS: Record<WeatherChoice, IconName> = {
  cloudy: 'weather-cloudy',
  clear: 'weather-sunny',
  rain: 'weather-pouring',
  snow: 'weather-snowy',
};

type Avoid = 'heels' | 'skirts' | 'dresses' | 'trousers' | 'black';
const AVOID: Avoid[] = ['heels', 'skirts', 'dresses', 'trousers', 'black'];

/** "Pas de jupe"… become the engine's exclusions. */
function exclusionsOf(avoid: Avoid[]) {
  const categories: WardrobeCategory[] = [];
  const subcategories: string[] = [];
  const colors: ColorKey[] = [];
  if (avoid.includes('heels')) subcategories.push('pumps');
  if (avoid.includes('skirts'))
    subcategories.push('shortSkirt', 'midiSkirt', 'longSkirt');
  if (avoid.includes('trousers')) subcategories.push('trousers', 'jeans');
  if (avoid.includes('dresses')) categories.push('DRESS');
  if (avoid.includes('black')) colors.push('black');
  return { categories, subcategories, colors };
}

const DEFAULT_TEMPERATURE = 15;
const MANDATORY_SHOWN = 8;

/** Inspirations tab, as on the "Créer une tenue" mockup. */
export function OutfitGeneratorScreen() {
  const { t } = useTranslation();
  const profile = useStyleProfile();
  const daily = useDailyStyle();
  const weather = useCurrentWeather();
  const manual = useManualTemperature();
  const generate = useGenerateOutfits();
  const mandatoryItem = useGenerationDraftStore((s) => s.mandatoryItem);
  const setMandatoryItem = useGenerationDraftStore((s) => s.setMandatoryItem);
  const wardrobe = useWardrobeList({ status: ['AVAILABLE'] });

  const preferred = profile.data?.preferredStyles ?? [];
  const current = weather.status === 'ready' ? weather.weather : null;
  // Smart defaults: the style of the day, the day's weather (a temperature
  // entered by hand first), everyday.
  // A choice made here holds until the style of the day changes on Home;
  // until then the style follows the day's one (or the profile, once loaded).
  const [chosen, setChosen] = useState<{
    daily: Style | null;
    style: Style | null;
  } | null>(null);
  const style =
    chosen && chosen.daily === daily
      ? chosen.style
      : (daily ?? preferred[0] ?? null);
  const setStyle = (next: Style | null) => setChosen({ daily, style: next });
  const [occasion, setOccasion] = useState<Occasion>('everyday');
  const [choice, setChoice] = useState<WeatherChoice | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [avoid, setAvoid] = useState<Avoid[]>([]);

  const weatherChoice =
    choice ?? weatherChoiceOf(current?.condition ?? null) ?? 'cloudy';
  const automatic = manual ?? current?.temperature ?? null;
  const shownTemperature = temperature ?? automatic ?? DEFAULT_TEMPERATURE;

  const styles_: Style[] = [
    ...preferred,
    ...STYLES.filter((s) => !preferred.includes(s)),
  ];
  const pieces = (wardrobe.data?.pages[0]?.items ?? [])
    .filter(
      (item) => item.category !== 'UNDERWEAR' && item.id !== mandatoryItem?.id,
    )
    .slice(0, MANDATORY_SHOWN);

  const submit = () => {
    const body: GenerateOutfitsInput = {
      style,
      occasion,
      temperature: Math.round(shownTemperature),
      condition: weatherChoice,
      mandatoryItemId: mandatoryItem?.id ?? null,
      exclusions: exclusionsOf(avoid),
    };
    generate.mutate(body, {
      onSuccess: (outfits) =>
        router.push({
          pathname: '/outfits/results',
          params: { ids: outfits.map((o) => o.id).join(',') },
        }),
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          back={false}
          title={t('outfits.generator.title')}
          overline={t('outfits.generator.overline')}
        />

        <View style={styles.section}>
          <SectionTitle
            variant="heading"
            title={t('outfits.generator.style')}
          />
          <ChipGroup<Style>
            allowNone
            tone="soft"
            options={styles_.map((s) => ({
              value: s,
              label: t(`wardrobe.styles.${s}`),
              icon: styleIcons[s],
            }))}
            value={style}
            onChange={setStyle}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle
            variant="heading"
            title={t('outfits.generator.occasion')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
            accessibilityRole="radiogroup"
          >
            {OCCASIONS.map((value) => (
              <OccasionCard
                key={value}
                occasion={value}
                label={t(`outfits.occasions.${value}`)}
                selected={occasion === value}
                onPress={() => setOccasion(value)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionTitle
            variant="heading"
            title={t('outfits.generator.weather')}
          />
          <ChipGroup<WeatherChoice>
            tone="soft"
            testIDPrefix="weather"
            options={WEATHER_CHOICES.map((value) => ({
              value,
              label: t(`outfits.conditions.${value}`),
              icon: WEATHER_ICONS[value],
            }))}
            value={weatherChoice}
            onChange={(value) => value && setChoice(value)}
          />
        </View>

        <View style={styles.section}>
          <TemperatureSlider
            title={
              <SectionTitle
                variant="heading"
                title={t('outfits.generator.temperature')}
              />
            }
            value={shownTemperature}
            onChange={setTemperature}
            unit={weather.unit}
            testID="generator-temperature"
          />
          {temperature === null && automatic !== null && (
            <AppText variant="hint">
              {t('outfits.generator.fromWeather')}
            </AppText>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle
            variant="heading"
            title={t('outfits.generator.mandatory')}
            note={t('outfits.generator.optional')}
            aside={t('outfits.generator.seeAll')}
            onAside={() => router.push('/outfits/pick-item')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: mandatoryItem === null }}
              accessibilityLabel={t('outfits.generator.noMandatory')}
              onPress={() => setMandatoryItem(null)}
              style={[
                styles.none,
                mandatoryItem === null && styles.noneSelected,
              ]}
            >
              <Ionicons name="close" size={24} color={colors.muted} />
              <AppText style={styles.noneText}>
                {t('outfits.generator.noMandatory')}
              </AppText>
            </Pressable>
            {mandatoryItem && (
              <OutfitItemTile item={mandatoryItem} selected width={112} />
            )}
            {pieces.map((item) => (
              <OutfitItemTile
                key={item.id}
                item={item}
                width={112}
                onPress={() => setMandatoryItem(item)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionTitle
            variant="heading"
            title={t('outfits.generator.constraints')}
            note={t('outfits.generator.optional')}
          />
          <ChipGroup<Avoid>
            multiple
            tone="soft"
            options={AVOID.map((value) => ({
              value,
              label: t(`outfits.generator.avoid.${value}`),
            }))}
            value={avoid}
            onChange={setAvoid}
          />
        </View>
      </ScrollPage>
      <View style={styles.footer}>
        <FormError
          message={
            generate.error
              ? t(errorMessageKey(generate.error) as 'apiErrors.unknown')
              : null
          }
        />
        <Button
          label={t('outfits.generator.submit')}
          loading={generate.isPending}
          onPress={submit}
        />
      </View>
    </SafeAreaView>
  );
}

function OccasionCard({
  occasion,
  label,
  selected,
  onPress,
}: {
  occasion: Occasion;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const photo = occasionPhotos[occasion];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.occasion, selected && styles.occasionSelected]}
    >
      <View style={styles.occasionPhoto}>
        {photo ? (
          <Image
            source={photo}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <MaterialCommunityIcons
            name={occasionIcons[occasion]}
            size={34}
            color={colors.primary}
          />
        )}
        {selected && (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
          </View>
        )}
      </View>
      <AppText style={styles.occasionLabel} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: { gap: spacing.md },
  row: { gap: spacing.sm },
  occasion: {
    width: 128,
    padding: 4,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  occasionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  occasionPhoto: {
    height: 80,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.input - 4,
    backgroundColor: colors.input,
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.onPrimary,
    backgroundColor: colors.primary,
  },
  occasionLabel: {
    textAlign: 'center',
    paddingVertical: spacing.sm,
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.title,
  },
  none: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.input,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  noneSelected: { borderStyle: 'solid', borderColor: colors.primary },
  noneText: { fontFamily: fonts.serif, fontSize: 14, color: colors.muted },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
