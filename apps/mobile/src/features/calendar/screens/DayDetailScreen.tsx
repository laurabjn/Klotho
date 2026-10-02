import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DAY_NOTE_MAX, type Outfit, type Season } from '@klotho/shared';
import { router, useLocalSearchParams } from 'expo-router';
import type { TFunction } from 'i18next';
import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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
import { ScrollToFocusedInputContext } from '@/components/ui/useScrollToFocusedInput';
import { OutfitCollage } from '@/features/outfits/components/OutfitCollage';
import {
  useMarkWorn,
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

import { DayPickerSheet } from '../components/DayPickerSheet';
import {
  useDayNote,
  useMovePlan,
  usePlans,
  useRegeneratePlan,
  useRemovePlan,
  useSaveDayNote,
} from '../hooks/usePlans';
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
  const plans = usePlans(day, day);
  const wears = worn.data ?? [];
  const plan = plans.data?.[0];
  // Once worn, the planned look is shown with the worn ones.
  const planned =
    plan && !wears.some((wear) => wear.outfit.id === plan.outfit.id)
      ? plan
      : undefined;
  const first = wears[0]?.outfit ?? planned?.outfit;
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

        {worn.isPending || plans.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : wears.length === 0 && !planned ? (
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
          <>
            {planned && (
              <DayLook
                outfit={planned.outfit}
                season={season}
                day={day}
                planned
                onMoved={setDay}
                note={<DayNoteRow day={day} />}
              />
            )}
            {wears.map((wear, index) => (
              <DayLook
                key={wear.id}
                outfit={wear.outfit}
                season={season}
                day={day}
                wearId={wear.id}
                // The note goes with the first look of the day.
                note={
                  !planned && index === 0 ? <DayNoteRow day={day} /> : undefined
                }
              />
            ))}
          </>
        )}
        {/* A day without a look can still have its note. */}
        {!worn.isPending &&
          !plans.isPending &&
          wears.length === 0 &&
          !planned && <DayNoteRow day={day} />}
      </ScrollPage>
    </SafeAreaView>
  );
}

function weatherText(t: TFunction, outfit: Outfit): string | null {
  const choice = weatherChoiceOf(outfit.condition);
  if (!choice || outfit.temperature === null) return null;
  return t('outfits.day.weatherText', {
    condition: t(`outfits.conditions.${choice}`),
    temperature: outfit.temperature,
    advice: t(`outfits.day.advice.${adviceFor(outfit.temperature)}`),
  });
}

/**
 * The look of the day: planned ("Changer la tenue", "Déplacer", "Je l'ai
 * portée", "Supprimer") or worn ("Voir la tenue", "Supprimer").
 */
function DayLook({
  outfit,
  season,
  day,
  wearId,
  planned = false,
  onMoved,
  note,
}: {
  outfit: Outfit;
  season: Season;
  day: string;
  wearId?: string;
  planned?: boolean;
  /** The day the plan was moved to (the screen follows it). */
  onMoved?: (day: string) => void;
  /** "Notes", with the other rows of the day, before the buttons. */
  note?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const compact = useCompactLayout();
  const favorite = useToggleOutfitFavorite(outfit.id);
  const removeWear = useRemoveWear();
  const removePlan = useRemovePlan();
  const regenerate = useRegeneratePlan();
  const move = useMovePlan();
  const wear = useMarkWorn(outfit.id);
  const [confirm, setConfirm] = useState(false);
  const [moving, setMoving] = useState(false);
  const openLook = () => router.push(`/outfits/${outfit.id}`);
  const weather = weatherText(t, outfit);
  const remove = planned ? removePlan : removeWear;
  const error = regenerate.error ?? wear.error ?? remove.error;

  return (
    <View style={styles.look}>
      <AppText variant="overline">
        {planned
          ? t('outfits.planning.plannedLook')
          : t('outfits.planning.wornLooks')}
      </AppText>
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
      {note}

      {planned ? (
        <>
          <View style={[styles.actions, compact && styles.stackedActions]}>
            <View style={compact ? undefined : styles.flex}>
              <Button
                icon="shuffle"
                decorated={false}
                label={t('outfits.day.change')}
                loading={regenerate.isPending}
                onPress={() => regenerate.mutate(day)}
              />
            </View>
            <View style={compact ? undefined : styles.flex}>
              <Button
                variant="outline"
                icon="calendar-outline"
                label={t('outfits.day.move')}
                onPress={() => setMoving(true)}
              />
            </View>
          </View>
          {day <= today() && (
            <Button
              variant="secondary"
              icon="checkmark-circle-outline"
              decorated={false}
              label={t('outfits.planning.wearPlanned')}
              loading={wear.isPending}
              onPress={() => wear.mutate(day)}
            />
          )}
        </>
      ) : (
        <Button
          icon="eye-outline"
          decorated={false}
          label={t('outfits.mine.see')}
          onPress={openLook}
        />
      )}
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
          error ? t(errorMessageKey(error) as 'apiErrors.unknown') : null
        }
      />
      <ConfirmDialog
        visible={confirm}
        icon="trash-outline"
        title={
          planned
            ? t('outfits.planning.removeTitle')
            : t('outfits.day.removeTitle')
        }
        message={
          planned
            ? t('outfits.planning.removeBody')
            : t('outfits.day.removeBody')
        }
        confirmLabel={t('outfits.day.remove')}
        cancelLabel={t('outfits.day.cancel')}
        loading={remove.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          planned
            ? removePlan.mutate(day, { onSettled: () => setConfirm(false) })
            : removeWear.mutate(wearId!, {
                onSettled: () => setConfirm(false),
              })
        }
      />
      {planned && (
        <DayPickerSheet
          visible={moving}
          title={t('outfits.planning.moveTitle')}
          overline={t('outfits.planning.moveOverline')}
          confirmLabel={t('outfits.planning.moveConfirm')}
          exclude={day}
          loading={move.isPending}
          error={
            move.error
              ? t(errorMessageKey(move.error) as 'apiErrors.unknown')
              : null
          }
          onClose={() => setMoving(false)}
          onConfirm={(toDay) =>
            move.mutate(
              { day, toDay },
              {
                onSuccess: () => {
                  setMoving(false);
                  onMoved?.(toDay);
                },
              },
            )
          }
        />
      )}
    </View>
  );
}

/** "Notes" of the day: shown, then edited in place. */
function DayNoteRow({ day }: { day: string }) {
  const { t } = useTranslation();
  const note = useDayNote(day);
  const save = useSaveDayNote(day);
  const [draft, setDraft] = useState<string | null>(null);
  const scrollIntoView = useContext(ScrollToFocusedInputContext);
  const text = note.data?.text ?? null;

  if (draft !== null) {
    return (
      <View style={[styles.row, styles.noteEdit]}>
        <AppText style={styles.rowLabel}>{t('outfits.planning.notes')}</AppText>
        <TextInput
          multiline
          autoFocus
          value={draft}
          onChangeText={setDraft}
          maxLength={DAY_NOTE_MAX}
          placeholder={t('outfits.planning.notePlaceholder')}
          placeholderTextColor={colors.placeholder}
          accessibilityLabel={t('outfits.planning.notes')}
          onFocus={() => scrollIntoView?.()}
          style={styles.noteInput}
        />
        <Button
          variant="secondary"
          decorated={false}
          label={t('outfits.planning.saveNote')}
          loading={save.isPending}
          onPress={() =>
            save.mutate(draft, { onSuccess: () => setDraft(null) })
          }
        />
      </View>
    );
  }
  return (
    <InfoRow
      icon="file-document-outline"
      label={t('outfits.planning.notes')}
      text={text ?? t('outfits.planning.noteEmpty')}
      onPress={() => setDraft(text ?? '')}
    />
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
  noteEdit: { flexDirection: 'column', alignItems: 'stretch' },
  noteInput: {
    minHeight: 72,
    padding: spacing.sm,
    textAlignVertical: 'top',
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    fontFamily: fonts.serifRegular,
    fontSize: 15,
    color: colors.body,
  },
});
