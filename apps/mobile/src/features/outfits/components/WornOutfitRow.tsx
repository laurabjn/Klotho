import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { OutfitWear } from '@klotho/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatDay } from '@/lib/days';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import {
  outfitSummary,
  weatherChoiceOf,
  weatherLine,
  WEATHER_ICONS,
} from '../lib/outfit-labels';
import { OutfitCollage } from './OutfitCollage';

/** A worn look in the history: day, weather, words, "Portée". */
export function WornOutfitRow({
  wear,
  badge,
}: {
  wear: OutfitWear;
  /** "Portée" by default; "Prévue" for a planned look. */
  badge?: string;
}) {
  const { t, i18n } = useTranslation();
  const { outfit } = wear;
  const date = formatDay(wear.wornOn, i18n.language);
  const weather = weatherLine(t, outfit);
  const choice = weatherChoiceOf(outfit.condition);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${date}, ${t('outfits.history.open')}`}
      onPress={() => router.push(`/calendar/${wear.wornOn}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.collage}>
        <OutfitCollage pieces={outfit.pieces} />
      </View>
      <View style={styles.text}>
        <View style={styles.dateRow}>
          <AppText style={styles.date}>{date}</AppText>
          <View style={styles.badge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.primary}
            />
            <AppText style={styles.badgeText}>
              {badge ?? t('outfits.history.worn')}
            </AppText>
          </View>
        </View>
        {weather && (
          <View style={styles.weather}>
            <MaterialCommunityIcons
              name={choice ? WEATHER_ICONS[choice] : 'thermometer'}
              size={18}
              color={colors.muted}
            />
            <AppText variant="hint" style={styles.weatherText}>
              {weather}
            </AppText>
          </View>
        )}
        <AppText variant="hint" numberOfLines={2}>
          {outfitSummary(t, outfit)}
        </AppText>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.muted}
        style={styles.chevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  collage: { width: '36%', alignSelf: 'center' },
  text: { flex: 1, gap: 4, paddingVertical: spacing.xs },
  dateRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  date: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 21,
    color: colors.title,
  },
  weather: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  weatherText: { fontSize: 13 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  badgeText: { fontFamily: fonts.serif, fontSize: 13, color: colors.link },
  chevron: { alignSelf: 'center' },
});
