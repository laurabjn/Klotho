import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { STYLES, type Outfit, type Style } from '@klotho/shared';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { GoldRule } from '@/components/ui/GoldRule';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useStyleProfile } from '@/features/preferences/hooks/useStyleProfile';
import { wardrobeApi } from '@/features/wardrobe/api/wardrobe.api';
import { ItemVisual } from '@/features/wardrobe/components/ItemVisual';
import { wardrobeKeys } from '@/features/wardrobe/hooks/useWardrobe';
import { OutfitCollage } from '@/features/outfits/components/OutfitCollage';
import { OutfitHeart } from '@/features/outfits/components/OutfitHeart';
import {
  useGenerateOutfits,
  useRecentOutfits,
} from '@/features/outfits/hooks/useOutfits';
import { outfitTitle } from '@/features/outfits/lib/outfit-labels';
import { itemTitle } from '@/features/wardrobe/labels';
import { WeatherTile } from '@/features/weather/components/WeatherTile';
import { useCurrentWeather } from '@/features/weather/hooks/useCurrentWeather';
import { useManualTemperature } from '@/features/weather/store/manual-temperature.store';
import { errorMessageKey } from '@/lib/api/errors';
import { styleIcons } from '@/theme/icons';
import { photos } from '@/theme/photos';
import { useCompactLayout } from '@/theme/useCompactLayout';
import { colors, radii, spacing } from '@/theme/tokens';

import { useDailyStyle, useDailyStyleStore } from '../store/daily-style.store';

const CLEAR = 'rgba(252, 248, 243, 0)';

/**
 * Home, as on the mockup: greeting and weather, outfit generation (coming
 * with Sprint 7), style of the day, and a forgotten piece to rediscover.
 */
export function HomeScreen() {
  const { t } = useTranslation();
  const firstName = useAuthStore((state) => state.user?.firstName ?? '');
  const openGenerator = () => router.navigate('/inspirations');
  const compact = useCompactLayout();
  const outfitOfTheDay = useOutfitOfTheDay();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <View style={[styles.hello, compact && styles.stacked]}>
          <View style={styles.helloText}>
            <AppText variant="title">
              {t('home.greeting', { firstName })}
            </AppText>
            <AppText variant="overline">{t('home.overline')}</AppText>
            <GoldRule />
          </View>
          <View style={compact ? styles.weatherFull : styles.weather}>
            <WeatherTile />
          </View>
        </View>

        <Button label={t('home.generate')} onPress={openGenerator} />

        <DailyStyle onChoose={outfitOfTheDay.prepare} />

        <OutfitOfTheDay {...outfitOfTheDay} onGenerate={openGenerator} />

        <Rediscover />
      </ScrollPage>
    </SafeAreaView>
  );
}

/** Looks generated today, newest first. */
function isToday(outfit: Outfit) {
  return (
    new Date(outfit.createdAt).toDateString() === new Date().toDateString()
  );
}

/**
 * Today's look in the style of the day: the latest one generated today in
 * that style, else one generated on the spot (everyday, today's weather).
 */
function useOutfitOfTheDay() {
  const daily = useDailyStyle();
  const recent = useRecentOutfits(RECENT_LOOKS);
  const generate = useGenerateOutfits();
  const weather = useCurrentWeather();
  const manual = useManualTemperature();
  const current = weather.status === 'ready' ? weather.weather : null;

  const today = (recent.data ?? []).filter(isToday);
  const lookIn = (style: Style | null) =>
    style ? today.find((outfit) => outfit.style === style) : today[0];
  const outfit = lookIn(daily) ?? null;

  /** Called when a style is picked: prepares a look if there is none yet. */
  const prepare = (style: Style | null) => {
    if (!style || lookIn(style) || generate.isPending) return;
    const temperature = manual ?? current?.temperature ?? null;
    generate.mutate({
      style,
      occasion: 'everyday',
      temperature: temperature === null ? null : Math.round(temperature),
      condition: current?.condition ?? null,
      mandatoryItemId: null,
      exclusions: { categories: [], subcategories: [], colors: [] },
      excludeOutfitIds: [],
    });
  };

  return {
    outfit,
    prepare,
    pending: generate.isPending,
    error: generate.error,
  };
}

/** How many recent looks are searched for today's one. */
const RECENT_LOOKS = 20;

/** Favourite styles first; the choice holds for the day. */
function DailyStyle({ onChoose }: { onChoose: (style: Style | null) => void }) {
  const { t } = useTranslation();
  const preferred = useStyleProfile().data?.preferredStyles ?? [];
  const daily = useDailyStyle();
  const choose = useDailyStyleStore((state) => state.choose);

  const ordered: Style[] = [
    ...preferred,
    ...STYLES.filter((style) => !preferred.includes(style)),
  ];

  return (
    <View style={styles.section}>
      <SectionTitle variant="overline" title={t('home.dailyStyle')} />
      {/* One line scrolling sideways: favourite styles first. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.chips}
      >
        {ordered.map((style) => (
          <Chip
            key={style}
            tone="soft"
            icon={styleIcons[style]}
            label={t(`wardrobe.styles.${style}`)}
            selected={daily === style}
            onPress={() => {
              const next = daily === style ? null : style;
              choose(next);
              onChoose(next);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Today's look in the style of the day, else an invitation to generate one
 * (with the photo of the mockup).
 */
function OutfitOfTheDay({
  outfit: today,
  pending,
  error,
  onGenerate,
}: ReturnType<typeof useOutfitOfTheDay> & { onGenerate: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.outfit}>
      {today ? (
        <View style={styles.outfitCollage}>
          <OutfitCollage pieces={today.pieces} />
        </View>
      ) : (
        <>
          <Image
            source={photos.outfitOfTheDay.source}
            style={styles.outfitPhoto}
            contentFit="cover"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          {/* The text side stays readable over the photo. */}
          <LinearGradient
            colors={[colors.surface, colors.surface, CLEAR]}
            locations={[0, 0.42, 0.62]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
      {today && <OutfitHeart outfit={today} />}
      <View style={styles.outfitText}>
        <AppText variant="title">{t('home.outfit.title')}</AppText>
        <AppText variant="overline">
          {today
            ? [
                today.style && t(`wardrobe.styles.${today.style}`),
                outfitTitle(t, today),
              ]
                .filter(Boolean)
                .join(' · ')
            : t('home.outfit.overline')}
        </AppText>
        {pending ? (
          <View style={styles.pending}>
            <ActivityIndicator color={colors.primary} />
            <AppText variant="hint">{t('home.outfit.generating')}</AppText>
          </View>
        ) : (
          error &&
          !today && (
            <AppText variant="hint">
              {t(errorMessageKey(error) as 'apiErrors.unknown')}
            </AppText>
          )
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={today ? t('home.outfit.see') : t('home.generate')}
          onPress={() =>
            today ? router.push(`/outfits/${today.id}`) : onGenerate()
          }
          style={({ pressed }) => [styles.soon, pressed && styles.pressed]}
        >
          <AppText style={styles.soonText}>
            {today ? t('home.outfit.see') : t('home.generate')}
          </AppText>
          <Ionicons name="arrow-forward" size={16} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

/** The available piece worn the least: an invitation to wear it again. */
function Rediscover() {
  const { t, i18n } = useTranslation();
  const piece = useQuery({
    queryKey: [...wardrobeKeys.all, 'rediscover'],
    queryFn: async () =>
      (
        await wardrobeApi.list({
          sort: 'leastWorn',
          status: ['AVAILABLE'],
          pageSize: 1,
        })
      ).items[0] ?? null,
  });
  const item = piece.data;
  if (!item) return null;

  const name = itemTitle(t, item);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('home.rediscover.open')}
      onPress={() => router.push(`/piece/${item.id}`)}
      style={({ pressed }) => [styles.rediscover, pressed && styles.pressed]}
    >
      <View style={styles.rediscoverText}>
        <AppText variant="overline">{t('home.rediscover.overline')}</AppText>
        <AppText variant="heading">{t('home.rediscover.title')}</AppText>
        <AppText style={styles.rediscoverBody}>
          {item.lastWornAt
            ? t('home.rediscover.since', {
                name,
                date: new Date(item.lastWornAt).toLocaleDateString(
                  i18n.language,
                ),
              })
            : t('home.rediscover.never', { name })}
        </AppText>
      </View>
      <View style={styles.rediscoverVisual}>
        <ItemVisual
          category={item.category}
          color={item.primaryColor}
          photo={item.photos[0]}
        />
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="hanger"
            size={18}
            color={colors.onPrimary}
          />
        </View>
        <View style={styles.next}>
          <Ionicons name="chevron-forward" size={18} color={colors.title} />
        </View>
      </View>
    </Pressable>
  );
}

const card = {
  overflow: 'hidden' as const,
  borderRadius: radii.card,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  shadowColor: colors.shadow,
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  hello: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  helloText: { flex: 1, gap: spacing.sm },
  weather: { width: '44%' },
  weatherFull: { alignSelf: 'stretch' },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  section: { gap: spacing.md },
  bleed: { marginHorizontal: -spacing.xl },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  outfit: { ...card, minHeight: 260 },
  outfitCollage: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    width: '44%',
    justifyContent: 'center',
  },
  outfitPhoto: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '62%',
  },
  outfitText: {
    width: '55%',
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  soon: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  pending: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  soonText: { color: colors.onPrimary, fontSize: 16 },
  pressed: { opacity: 0.8 },
  rediscover: {
    ...card,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  rediscoverText: { flex: 1, gap: spacing.xs },
  rediscoverBody: { fontSize: 15, lineHeight: 21 },
  rediscoverVisual: {
    width: '40%',
    overflow: 'hidden',
    borderRadius: radii.input,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  next: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
