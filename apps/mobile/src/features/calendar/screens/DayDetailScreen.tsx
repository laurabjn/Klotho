import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { OutfitWear, Season } from '@klotho/shared';
import { router, useLocalSearchParams } from 'expo-router';
import type { TFunction } from 'i18next';
import { useState } from 'react';
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { OutfitCollage } from '@/features/outfits/components/OutfitCollage';
import {
  useRemoveWear,
  useToggleOutfitFavorite,
  useWornLooks,
} from '@/features/outfits/hooks/useOutfits';
import {
  outfitSummary,
  outfitTitle,
  weatherChoiceOf,
  WEATHER_ICONS,
} from '@/features/outfits/lib/outfit-labels';
import { errorMessageKey } from '@/lib/api/errors';
import { addDays, formatDay, fromDay, today } from '@/lib/days';
import {
  occasionIcons,
  seasonIcons,
  styleIcons,
  type IconName,
} from '@/theme/icons';
import { useCompactLayout } from '@/theme/useCompactLayout';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

/** The season of a day (northern hemisphere). */
function seasonOf(day: string): Season {
  const month = fromDay(day).getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/** A word of advice for the day's temperature. */
function adviceFor(temperature: number) {
  if (temperature <= 8) return 'cold' as const;
  if (temperature <= 16) return 'cool' as const;
  if (temperature <= 23) return 'mild' as const;
  return 'warm' as const;
}

/** "Détail du jour", as on the mockup: the look(s) worn that day. */
export function DayDetailScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{ day: string }>();
  const [day, setDay] = useState(params.day);
  const worn = useWornLooks({ from: day, to: day });
  const [soon, setSoon] = useState(false);
  const wears = worn.data ?? [];
  const first = wears[0]?.outfit;
  const choice = first ? weatherChoiceOf(first.condition) : null;
  const season = seasonOf(day);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('outfits.day.title')}
          overline={t('outfits.day.overline')}
        />

        <View style={styles.card}>
          <View style={styles.dateBar}>
            <RoundButton
              icon="chevron-back"
              label={t('outfits.day.previous')}
              onPress={() => setDay(addDays(day, -1))}
            />
            <AppText variant="heading" center style={styles.date}>
              {formatDay(day, i18n.language)}
            </AppText>
            <RoundButton
              icon="chevron-forward"
              label={t('outfits.day.next')}
              onPress={() => setDay(addDays(day, 1))}
            />
          </View>
          <View style={styles.facts}>
            <Fact
              icon={choice ? WEATHER_ICONS[choice] : 'thermometer'}
              label={t('outfits.day.weather')}
              value={
                first?.temperature != null
                  ? `${first.temperature}°C`
                  : t('outfits.day.unknown')
              }
              detail={choice ? t(`outfits.conditions.${choice}`) : undefined}
            />
            <Fact
              icon={
                first?.occasion
                  ? occasionIcons[first.occasion]
                  : 'calendar-blank-outline'
              }
              label={t('outfits.day.occasion')}
              value={
                first?.occasion
                  ? t(`outfits.occasions.${first.occasion}`)
                  : t('outfits.day.unknown')
              }
            />
            <Fact
              icon={seasonIcons[season]}
              label={t('outfits.day.season')}
              value={t(`wardrobe.seasons.${season}`)}
            />
          </View>
        </View>

        {worn.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : wears.length === 0 ? (
          <EmptyState
            icon="calendar-clear-outline"
            title={t('outfits.day.empty')}
            body=""
            {...(day === today() && {
              actionLabel: t('outfits.day.generate'),
              onAction: () => router.navigate('/inspirations'),
            })}
          />
        ) : (
          wears.map((wear) => (
            <WornLook
              key={wear.id}
              wear={wear}
              season={season}
              onSoon={() => setSoon(true)}
            />
          ))
        )}
      </ScrollPage>
      <ConfirmDialog
        visible={soon}
        icon="sparkles-outline"
        title={t('outfits.soon.title')}
        message={t('outfits.soon.body')}
        confirmLabel={t('outfits.soon.ok')}
        onConfirm={() => setSoon(false)}
        onCancel={() => setSoon(false)}
      />
    </SafeAreaView>
  );
}

function weatherText(t: TFunction, wear: OutfitWear): string | null {
  const { outfit } = wear;
  const choice = weatherChoiceOf(outfit.condition);
  if (!choice || outfit.temperature === null) return null;
  return t('outfits.day.weatherText', {
    condition: t(`outfits.conditions.${choice}`),
    temperature: outfit.temperature,
    advice: t(`outfits.day.advice.${adviceFor(outfit.temperature)}`),
  });
}

function WornLook({
  wear,
  season,
  onSoon,
}: {
  wear: OutfitWear;
  season: Season;
  onSoon: () => void;
}) {
  const { t } = useTranslation();
  const { outfit } = wear;
  const compact = useCompactLayout();
  const favorite = useToggleOutfitFavorite(outfit.id);
  const remove = useRemoveWear();
  const [confirm, setConfirm] = useState(false);
  const openLook = () => router.push(`/outfits/${outfit.id}`);
  const weather = weatherText(t, wear);

  return (
    <View style={styles.look}>
      <View style={[styles.card, styles.lookCard, compact && styles.stacked]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('outfits.mine.see')}
          onPress={openLook}
          style={compact ? styles.collageFull : styles.collage}
        >
          <OutfitCollage pieces={outfit.pieces} />
        </Pressable>
        <View style={styles.lookText}>
          <View style={styles.titleRow}>
            <AppText variant="heading" style={styles.title}>
              {outfitTitle(t, outfit)}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                outfit.isFavorite
                  ? t('outfits.details.unfavorite')
                  : t('outfits.details.favorite')
              }
              accessibilityState={{ selected: outfit.isFavorite }}
              onPress={() => favorite.mutate(!outfit.isFavorite)}
              hitSlop={6}
              style={styles.heart}
            >
              <Ionicons
                name={outfit.isFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color={colors.primary}
              />
            </Pressable>
          </View>
          {outfit.occasion && (
            <AppText variant="overline">
              {t('outfits.day.forOccasion', {
                occasion: t(`outfits.details.forOccasion.${outfit.occasion}`),
              })}
            </AppText>
          )}
          <AppText style={styles.summary}>{outfitSummary(t, outfit)}</AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tags}
          >
            {outfit.occasion && (
              <Tag icon={occasionIcons[outfit.occasion]}>
                {t(`outfits.occasions.${outfit.occasion}`)}
              </Tag>
            )}
            <Tag icon={seasonIcons[season]}>
              {t(`wardrobe.seasons.${season}`)}
            </Tag>
            {outfit.style && (
              <Tag icon={styleIcons[outfit.style]}>
                {t(`wardrobe.styles.${outfit.style}`)}
              </Tag>
            )}
          </ScrollView>
        </View>
      </View>

      {weather && (
        <InfoRow
          icon={WEATHER_ICONS[weatherChoiceOf(outfit.condition)!]}
          label={t('outfits.day.weather')}
          text={weather}
          onPress={() => router.push('/weather-settings')}
        />
      )}
      {outfit.occasion && (
        <InfoRow
          icon="calendar-blank-outline"
          label={t('outfits.day.occasion')}
          text={t('outfits.day.occasionText', {
            occasion: t(`outfits.details.forOccasion.${outfit.occasion}`),
          })}
          onPress={openLook}
        />
      )}

      <View style={[styles.actions, compact && styles.stackedActions]}>
        <View style={compact ? undefined : styles.flex}>
          <Button
            icon="shuffle"
            decorated={false}
            label={t('outfits.day.change')}
            onPress={onSoon}
          />
        </View>
        <View style={compact ? undefined : styles.flex}>
          <Button
            variant="outline"
            icon="calendar-outline"
            label={t('outfits.day.move')}
            onPress={onSoon}
          />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('outfits.day.remove')}
        onPress={() => setConfirm(true)}
        style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={18} color={colors.link} />
        <AppText style={styles.removeText}>{t('outfits.day.remove')}</AppText>
      </Pressable>
      <FormError
        message={
          remove.error
            ? t(errorMessageKey(remove.error) as 'apiErrors.unknown')
            : null
        }
      />
      <ConfirmDialog
        visible={confirm}
        icon="trash-outline"
        title={t('outfits.day.removeTitle')}
        message={t('outfits.day.removeBody')}
        confirmLabel={t('outfits.day.remove')}
        cancelLabel={t('outfits.day.cancel')}
        loading={remove.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          remove.mutate(wear.id, { onSettled: () => setConfirm(false) })
        }
      />
    </View>
  );
}

function Fact({
  icon,
  label,
  value,
  detail,
}: {
  icon: IconName;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <View style={styles.fact}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
      <View style={styles.factText}>
        <AppText variant="hint" numberOfLines={1} maxFontSizeMultiplier={1.1}>
          {label}
        </AppText>
        <AppText
          numberOfLines={2}
          maxFontSizeMultiplier={1.1}
          style={styles.factValue}
        >
          {value}
        </AppText>
        {detail && (
          <AppText variant="hint" numberOfLines={1} maxFontSizeMultiplier={1.1}>
            {detail}
          </AppText>
        )}
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  text,
  onPress,
}: {
  icon: IconName;
  label: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${text}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText variant="hint" style={styles.rowText}>
        {text}
      </AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function Tag({ icon, children }: { icon: IconName; children: string }) {
  return (
    <View style={styles.tag}>
      <MaterialCommunityIcons name={icon} size={14} color={colors.primary} />
      <AppText maxFontSizeMultiplier={1.1} style={styles.tagText}>
        {children}
      </AppText>
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.round, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={colors.title} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dateBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { flex: 1, fontSize: 20, lineHeight: 25 },
  round: {
    width: touchTarget - 4,
    height: touchTarget - 4,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  pressed: { opacity: 0.7 },
  facts: { flexDirection: 'row', gap: spacing.xs },
  fact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radii.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  factText: { flex: 1 },
  factValue: {
    fontFamily: fonts.serif,
    fontSize: 15,
    lineHeight: 18,
    color: colors.title,
  },
  look: { gap: spacing.md },
  lookCard: { flexDirection: 'row' },
  stacked: { flexDirection: 'column' },
  collage: { width: '50%', alignSelf: 'center' },
  collageFull: { alignSelf: 'stretch' },
  lookText: { flex: 1, gap: spacing.sm, paddingVertical: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  title: { flex: 1, fontSize: 21, lineHeight: 25 },
  heart: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  summary: { fontSize: 14, lineHeight: 19 },
  tags: { gap: spacing.xs },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  tagText: { fontFamily: fonts.serif, fontSize: 13, color: colors.title },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowLabel: {
    width: 84,
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.title,
  },
  rowText: { flex: 1, fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  stackedActions: { flexDirection: 'column' },
  flex: { flex: 1 },
  remove: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#E2C4BA',
    backgroundColor: colors.background,
  },
  removeText: { fontFamily: fonts.serif, fontSize: 17, color: colors.link },
});
