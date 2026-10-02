import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Outfit, OutfitPlan, OutfitWear } from '@klotho/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/ui/GoldRule';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { OutfitCollage } from '@/features/outfits/components/OutfitCollage';
import { useWornLooks } from '@/features/outfits/hooks/useOutfits';
import {
  weatherChoiceOf,
  WEATHER_ICONS,
} from '@/features/outfits/lib/outfit-labels';
import { useDailyStyle } from '@/features/home/store/daily-style.store';
import { WornOutfitRow } from '@/features/outfits/components/WornOutfitRow';
import { errorMessageKey } from '@/lib/api/errors';
import { WeatherTile } from '@/features/weather/components/WeatherTile';
import {
  addDays,
  addMonths,
  endOfMonth,
  formatDay,
  monthGrid,
  startOfMonth,
  startOfWeek,
  today,
} from '@/lib/days';
import { occasionIcons } from '@/theme/icons';
import { useCompactLayout } from '@/theme/useCompactLayout';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

import { PlannedDialog } from '../components/PlannedDialog';
import { plansByDay, usePlanWeek, usePlans } from '../hooks/usePlans';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** Worn looks by day (the first one of a day stands for it). */
function byDay(wears: OutfitWear[] | undefined): Map<string, OutfitWear> {
  const days = new Map<string, OutfitWear>();
  for (const wear of wears ?? [])
    if (!days.has(wear.wornOn)) days.set(wear.wornOn, wear);
  return days;
}

type View_ = 'week' | 'month' | 'list';
const VIEWS: View_[] = ['week', 'month', 'list'];

/** What a day shows: the look worn, else the look planned. */
function useDays(from: string, to: string) {
  const worn = byDay(useWornLooks({ from, to }).data);
  const planned = plansByDay(usePlans(from, to).data);
  return { worn, planned };
}

/**
 * "Calendrier" tab: the week, the month or the list of planned looks, and
 * "Planifier ma semaine".
 */
export function CalendarScreen() {
  const { t } = useTranslation();
  const compact = useCompactLayout();
  const [view, setView] = useState<View_>('month');
  const planWeek = usePlanWeek();
  const daily = useDailyStyle();
  const [result, setResult] = useState<OutfitPlan[] | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <View style={[styles.hello, compact && styles.stacked]}>
          <View style={styles.helloText}>
            <AppText variant="title">{t('outfits.calendar.title')}</AppText>
            <AppText variant="overline">
              {t('outfits.calendar.overline')}
            </AppText>
            <GoldRule />
          </View>
          <View style={compact ? styles.weatherFull : styles.weather}>
            <WeatherTile />
          </View>
        </View>

        <Segmented
          value={view}
          onChange={setView}
          label={(value) => t(`outfits.planning.views.${value}`)}
        />

        {view === 'month' && (
          <>
            <Month />
            <Week />
          </>
        )}
        {view === 'week' && <Week navigable />}
        {view === 'list' && <Upcoming />}

        {planWeek.error && (
          <AppText variant="hint" center style={styles.error}>
            {t(errorMessageKey(planWeek.error) as 'apiErrors.unknown')}
          </AppText>
        )}
        <Button
          label={t('outfits.calendar.plan')}
          loading={planWeek.isPending}
          onPress={() =>
            planWeek.mutate(
              { from: today(), style: daily },
              { onSuccess: setResult },
            )
          }
        />
      </ScrollPage>
      <PlannedDialog
        visible={result !== null}
        title={
          result?.length
            ? t('outfits.planning.doneTitle')
            : t('outfits.calendar.plan')
        }
        overline={
          result?.length ? t('outfits.planning.doneOverline') : undefined
        }
        message={
          result?.length
            ? t('outfits.planning.doneBody')
            : t('outfits.planning.weekFull')
        }
        onSeeCalendar={() => {
          setResult(null);
          setView('week');
        }}
        onClose={() => setResult(null)}
      />
    </SafeAreaView>
  );
}

function Month() {
  const { t, i18n } = useTranslation();
  const now = today();
  const [month, setMonth] = useState(startOfMonth(now));
  const { worn, planned } = useDays(month, endOfMonth(month));
  const title = formatDay(month, i18n.language, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.monthHeader}>
        <RoundButton
          icon="chevron-back"
          label={t('outfits.calendar.previous')}
          onPress={() => setMonth(addMonths(month, -1))}
        />
        <AppText variant="heading" center style={styles.monthTitle}>
          {title}
        </AppText>
        <RoundButton
          icon="chevron-forward"
          label={t('outfits.calendar.next')}
          onPress={() => setMonth(addMonths(month, 1))}
        />
      </View>
      <View style={styles.week}>
        {WEEKDAYS.map((weekday) => (
          <AppText key={weekday} variant="overline" style={styles.weekday}>
            {t(`outfits.calendar.weekdays.${weekday}`)}
          </AppText>
        ))}
      </View>
      {monthGrid(month).map((week) => (
        <View key={week[0]} style={styles.week}>
          {week.map((day) => {
            const inMonth = day.startsWith(month.slice(0, 7));
            const isToday = day === now;
            const hasLook = worn.has(day);
            const isPlanned = !hasLook && planned.has(day);
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={t('outfits.calendar.dayLabel', {
                  date: formatDay(day, i18n.language),
                  state: hasLook
                    ? t('outfits.calendar.dayWorn')
                    : isPlanned
                      ? t('outfits.planning.planned')
                      : t('outfits.calendar.dayEmpty'),
                })}
                onPress={() => router.push(`/calendar/${day}`)}
                style={styles.dayCell}
              >
                <View
                  style={[
                    styles.dayCircle,
                    hasLook && styles.dayWorn,
                    isPlanned && styles.dayPlanned,
                    isToday && styles.dayToday,
                  ]}
                >
                  <AppText
                    maxFontSizeMultiplier={1.1}
                    style={[
                      styles.dayNumber,
                      !inMonth && styles.dayOther,
                      isToday && styles.dayNumberToday,
                    ]}
                  >
                    {String(Number(day.slice(8)))}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.dot,
                    hasLook && styles.dotOn,
                    isPlanned && styles.dotPlanned,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * "Tenues de la semaine": Monday to Sunday, the look worn or planned each
 * day; `navigable` adds the arrows to change week (the "Semaine" view).
 */
function Week({ navigable = false }: { navigable?: boolean }) {
  const { t, i18n } = useTranslation();
  const [monday, setMonday] = useState(startOfWeek(today()));
  const sunday = addDays(monday, 6);
  const { worn, planned } = useDays(monday, sunday);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const short = { day: 'numeric', month: 'short' } as const;

  return (
    <View style={styles.section}>
      {navigable ? (
        <View style={[styles.card, styles.monthHeader]}>
          <RoundButton
            icon="chevron-back"
            label={t('outfits.calendar.previous')}
            onPress={() => setMonday(addDays(monday, -7))}
          />
          <AppText variant="heading" center style={styles.monthTitle}>
            {`${formatDay(monday, i18n.language, short)} – ${formatDay(sunday, i18n.language, short)}`}
          </AppText>
          <RoundButton
            icon="chevron-forward"
            label={t('outfits.calendar.next')}
            onPress={() => setMonday(addDays(monday, 7))}
          />
        </View>
      ) : (
        <SectionTitle
          variant="heading"
          title={t('outfits.calendar.week')}
          aside={t('outfits.calendar.seeAll')}
          onAside={() => router.push('/history')}
        />
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.weekLine}
      >
        {days.map((day, index) => {
          const wear = worn.get(day);
          const plan = planned.get(day);
          const outfit: Outfit | undefined = wear?.outfit ?? plan?.outfit;
          const occasion = outfit?.occasion;
          const forecast = plan?.forecast;
          const choice = forecast ? weatherChoiceOf(forecast.condition) : null;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={t('outfits.calendar.dayLabel', {
                date: formatDay(day, i18n.language),
                state: wear
                  ? t('outfits.calendar.dayWorn')
                  : plan
                    ? t('outfits.planning.planned')
                    : t('outfits.calendar.dayEmpty'),
              })}
              onPress={() => router.push(`/calendar/${day}`)}
              style={({ pressed }) => [
                styles.weekCell,
                pressed && styles.pressed,
              ]}
            >
              <AppText style={styles.weekDay} maxFontSizeMultiplier={1.1}>
                {t(`outfits.calendar.weekdays.${WEEKDAYS[index]!}`)}
              </AppText>
              <AppText
                variant="hint"
                numberOfLines={1}
                maxFontSizeMultiplier={1.1}
                style={styles.weekDate}
              >
                {formatDay(day, i18n.language, {
                  day: 'numeric',
                  month: 'short',
                })}
              </AppText>
              {forecast ? (
                <View style={styles.forecast}>
                  {choice && (
                    <MaterialCommunityIcons
                      name={WEATHER_ICONS[choice]}
                      size={14}
                      color={colors.muted}
                    />
                  )}
                  <AppText variant="hint" maxFontSizeMultiplier={1}>
                    {`${forecast.temperature}°C`}
                  </AppText>
                </View>
              ) : (
                <View style={styles.forecastSpace} />
              )}
              <View style={[styles.weekLook, !wear && plan && styles.planned]}>
                {outfit ? (
                  <OutfitCollage pieces={outfit.pieces} />
                ) : (
                  <View style={styles.weekEmpty}>
                    <MaterialCommunityIcons
                      name="hanger"
                      size={22}
                      color={colors.border}
                    />
                  </View>
                )}
              </View>
              {occasion ? (
                <View style={styles.weekTag}>
                  <MaterialCommunityIcons
                    name={occasionIcons[occasion]}
                    size={11}
                    color={colors.primary}
                  />
                  <AppText
                    numberOfLines={1}
                    maxFontSizeMultiplier={1}
                    style={styles.weekTagText}
                  >
                    {t(`outfits.occasions.${occasion}`)}
                  </AppText>
                </View>
              ) : (
                <View style={styles.weekTagSpace} />
              )}
              <Ionicons
                name="ellipsis-horizontal"
                size={14}
                color={colors.muted}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** "Liste": the planned looks of the next weeks. */
function Upcoming() {
  const { t } = useTranslation();
  const from = today();
  const plans = usePlans(from, addDays(from, 30));
  const list = plans.data ?? [];

  return (
    <View style={styles.section}>
      <AppText variant="heading">{t('outfits.planning.upcoming')}</AppText>
      {plans.isSuccess && list.length === 0 && (
        <AppText variant="hint">{t('outfits.planning.upcomingEmpty')}</AppText>
      )}
      {list.map((plan) => (
        <WornOutfitRow
          key={plan.id}
          wear={{ id: plan.id, wornOn: plan.day, outfit: plan.outfit }}
          badge={t('outfits.planning.planned')}
        />
      ))}
    </View>
  );
}

function Segmented({
  value,
  onChange,
  label,
}: {
  value: View_;
  onChange: (value: View_) => void;
  label: (value: View_) => string;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {VIEWS.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label(option)}
            onPress={() => onChange(option)}
            style={[styles.segment, selected && styles.segmentOn]}
          >
            <AppText
              maxFontSizeMultiplier={1.1}
              style={[styles.segmentText, selected && styles.segmentTextOn]}
            >
              {label(option)}
            </AppText>
          </Pressable>
        );
      })}
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

const DAY_SIZE = 38;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  hello: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  helloText: { flex: 1, gap: spacing.sm },
  weather: { width: '44%' },
  weatherFull: { alignSelf: 'stretch' },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  monthTitle: { flex: 1 },
  round: {
    width: touchTarget - 4,
    height: touchTarget - 4,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  pressed: { opacity: 0.7 },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', letterSpacing: 1 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  dayCircle: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayWorn: { backgroundColor: colors.primaryLight },
  dayToday: { backgroundColor: colors.primary },
  // A planned (not yet worn) day: a rose ring.
  dayPlanned: { borderWidth: 1.5, borderColor: colors.primary },
  dayNumber: {
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 21,
    color: colors.title,
  },
  dayOther: { color: colors.border },
  dayNumberToday: { color: colors.onPrimary },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
  dotOn: { backgroundColor: colors.primary },
  dotPlanned: { borderWidth: 1, borderColor: colors.primary },
  section: { gap: spacing.md },
  bleed: { marginHorizontal: -spacing.xl },
  weekLine: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  weekCell: {
    width: 92,
    alignItems: 'center',
    gap: 2,
    padding: spacing.xs,
    borderRadius: radii.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  weekDay: {
    fontFamily: fonts.serif,
    fontSize: 15,
    lineHeight: 19,
    color: colors.title,
  },
  weekDate: { fontSize: 12, lineHeight: 16 },
  forecast: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  forecastSpace: { height: 16 },
  planned: { opacity: 0.85 },
  error: { color: colors.link },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  segmentOn: { backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.serif, fontSize: 16, color: colors.title },
  segmentTextOn: { color: colors.onPrimary },
  weekLook: { alignSelf: 'stretch', marginVertical: spacing.xs },
  weekEmpty: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.input - 4,
    backgroundColor: colors.input,
  },
  weekTagSpace: { height: 16 },
  weekTag: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  weekTagText: { flexShrink: 1, fontSize: 11, color: colors.title },
});
