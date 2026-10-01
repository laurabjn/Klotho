import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { OutfitWear } from '@klotho/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GoldRule } from '@/components/ui/GoldRule';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { OutfitCollage } from '@/features/outfits/components/OutfitCollage';
import { useWornLooks } from '@/features/outfits/hooks/useOutfits';
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

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** Worn looks by day (the first one of a day stands for it). */
function byDay(wears: OutfitWear[] | undefined): Map<string, OutfitWear> {
  const days = new Map<string, OutfitWear>();
  for (const wear of wears ?? [])
    if (!days.has(wear.wornOn)) days.set(wear.wornOn, wear);
  return days;
}

/** "Calendrier" tab: the month of worn looks and the week's outfits. */
export function CalendarScreen() {
  const { t } = useTranslation();
  const compact = useCompactLayout();
  const [soon, setSoon] = useState(false);

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

        <Month />
        <Week />

        <Button
          label={t('outfits.calendar.plan')}
          onPress={() => setSoon(true)}
        />
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

function Month() {
  const { t, i18n } = useTranslation();
  const now = today();
  const [month, setMonth] = useState(startOfMonth(now));
  const worn = byDay(useWornLooks({ from: month, to: endOfMonth(month) }).data);
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
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={t('outfits.calendar.dayLabel', {
                  date: formatDay(day, i18n.language),
                  state: hasLook
                    ? t('outfits.calendar.dayWorn')
                    : t('outfits.calendar.dayEmpty'),
                })}
                onPress={() => router.push(`/calendar/${day}`)}
                style={styles.dayCell}
              >
                <View
                  style={[
                    styles.dayCircle,
                    hasLook && styles.dayWorn,
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
                <View style={[styles.dot, hasLook && styles.dotOn]} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** "Tenues de la semaine": Monday to Sunday of this week. */
function Week() {
  const { t, i18n } = useTranslation();
  const monday = startOfWeek(today());
  const sunday = addDays(monday, 6);
  const worn = byDay(useWornLooks({ from: monday, to: sunday }).data);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <View style={styles.section}>
      <SectionTitle
        variant="heading"
        title={t('outfits.calendar.week')}
        aside={t('outfits.calendar.seeAll')}
        onAside={() => router.push('/history')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.weekLine}
      >
        {days.map((day, index) => {
          const wear = worn.get(day);
          const occasion = wear?.outfit.occasion;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={t('outfits.calendar.dayLabel', {
                date: formatDay(day, i18n.language),
                state: wear
                  ? t('outfits.calendar.dayWorn')
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
              <View style={styles.weekLook}>
                {wear ? (
                  <OutfitCollage pieces={wear.outfit.pieces} />
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
