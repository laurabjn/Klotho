import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { STYLES, type Style } from '@klotho/shared';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GoldRule } from '@/components/ui/GoldRule';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useStyleProfile } from '@/features/preferences/hooks/useStyleProfile';
import { wardrobeApi } from '@/features/wardrobe/api/wardrobe.api';
import { ItemVisual } from '@/features/wardrobe/components/ItemVisual';
import { wardrobeKeys } from '@/features/wardrobe/hooks/useWardrobe';
import { itemTitle } from '@/features/wardrobe/labels';
import { WeatherTile } from '@/features/weather/components/WeatherTile';
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
  const [soonVisible, setSoonVisible] = useState(false);
  const soon = () => setSoonVisible(true);
  const compact = useCompactLayout();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
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

        <Button label={t('home.generate')} onPress={soon} />

        <DailyStyle />

        <OutfitOfTheDay onPress={soon} />

        <Rediscover />
      </ScrollView>
      <ConfirmDialog
        visible={soonVisible}
        icon="sparkles-outline"
        title={t('home.soonTitle')}
        message={t('home.soonBody')}
        confirmLabel={t('home.ok')}
        onConfirm={() => setSoonVisible(false)}
        onCancel={() => setSoonVisible(false)}
      />
    </SafeAreaView>
  );
}

/** Favourite styles first; the choice holds for the day. */
function DailyStyle() {
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
            onPress={() => choose(daily === style ? null : style)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function OutfitOfTheDay({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.outfit}>
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
      <View style={styles.outfitText}>
        <AppText variant="title">{t('home.outfit.title')}</AppText>
        <AppText variant="overline">{t('home.outfit.overline')}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.outfit.soon')}
          onPress={onPress}
          style={({ pressed }) => [styles.soon, pressed && styles.pressed]}
        >
          <AppText style={styles.soonText}>{t('home.outfit.soon')}</AppText>
          <Ionicons name="sparkles" size={16} color={colors.onPrimary} />
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
