import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  COLORS,
  TEMPERATURE_UNITS,
  type StyleProfileFields,
  type TemperatureUnit,
} from '@klotho/shared';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { UserAvatar } from '@/components/brand/UserAvatar';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { signOut, useAuthStore } from '@/features/auth/store/auth.store';
import {
  toFields,
  useSaveStyleProfile,
  useStyleProfile,
} from '@/features/preferences/hooks/useStyleProfile';
import { useFavoriteOutfitCount } from '@/features/outfits/hooks/useOutfits';
import { MetalPicker } from '@/features/preferences/components/MetalPicker';
import { useWardrobeStats } from '@/features/wardrobe/hooks/useWardrobe';
import {
  useSaveWeatherSettings,
  useWeatherSettings,
} from '@/features/weather/hooks/useWeatherSettings';
import { styleIcons, type IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

const AVATAR_SIZE = 88;
/** Room the three stats need next to the photo, at a normal text size. */
const STATS_MIN_WIDTH = 236;

/** "Moi" tab, as on the "Mon profil" mockup. */
export function MeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const profile = useStyleProfile();
  const saveProfile = useSaveStyleProfile();
  const stats = useWardrobeStats();
  const favoriteCount = useFavoriteOutfitCount();
  const weather = useWeatherSettings();
  const saveWeather = useSaveWeatherSettings();
  const [dialog, setDialog] = useState<'logout' | 'soon' | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const soon = () => setDialog('soon');

  const fields = profile.data ? toFields(profile.data) : null;
  const preferredStyles = fields?.preferredStyles ?? [];
  const preferredColors = fields?.preferredColors ?? [];
  const metals = fields?.preferredMetals ?? [];
  const unit = weather.data?.temperatureUnit ?? 'celsius';

  const save = (changes: Partial<StyleProfileFields>) => {
    if (fields) saveProfile.mutate({ ...fields, ...changes });
  };
  const setUnit = (temperatureUnit: TemperatureUnit) => {
    if (weather.data && temperatureUnit !== unit)
      saveWeather.mutate({ ...weather.data, temperatureUnit });
  };
  const openPreferences = () => router.push('/preferences');

  // The identity card follows the mockup when it really fits: measured on
  // the phone, with its own text size, instead of guessed from the screen.
  const { fontScale } = useWindowDimensions();
  const [columnWidth, setColumnWidth] = useState(0);
  const [nameWraps, setNameWraps] = useState(false);
  const statsBeside = columnWidth >= STATS_MIN_WIDTH * Math.max(fontScale, 1);
  const name = (
    <AppText
      variant="title"
      style={styles.name}
      // "Modifier" moves under the e-mail rather than squeezing the name.
      onTextLayout={(event) => {
        if (event.nativeEvent.lines.length > 1) setNameWraps(true);
      }}
    >
      {user?.firstName}
    </AppText>
  );
  const editButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('profile.edit')}
      onPress={soon}
      style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
    >
      <Ionicons name="pencil-outline" size={15} color={colors.primary} />
      <AppText style={styles.editText}>{t('profile.edit')}</AppText>
    </Pressable>
  );
  const statsRow = (
    <View style={[styles.stats, !statsBeside && styles.statsBelow]}>
      <Stat
        icon="hanger"
        value={stats.data ? String(stats.data.total) : '…'}
        label={t('profile.pieces', { count: stats.data?.total ?? 0 })}
      />
      <View style={styles.statDivider} />
      <Stat
        icon="heart-outline"
        value={
          favoriteCount.data === undefined ? '…' : String(favoriteCount.data)
        }
        label={t('profile.favorites', { count: favoriteCount.data ?? 0 })}
      />
      <View style={styles.statDivider} />
      <Stat
        icon={
          stats.data?.dominantStyle
            ? styleIcons[stats.data.dominantStyle]
            : 'flower-outline'
        }
        label={t('profile.dominantStyle')}
        value={
          stats.data?.dominantStyle
            ? t(`wardrobe.styles.${stats.data.dominantStyle}`)
            : '—'
        }
        accent
        reversed
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          back={false}
          title={t('profile.title')}
          overline={t('profile.overline')}
        />

        <Card>
          <View style={styles.identity}>
            <View>
              <UserAvatar size={AVATAR_SIZE} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('profile.editPhoto')}
                onPress={soon}
                hitSlop={6}
                style={styles.pencil}
              >
                <Ionicons name="pencil" size={14} color={colors.onPrimary} />
              </Pressable>
            </View>
            <View
              style={styles.identityText}
              onLayout={(event) =>
                setColumnWidth(event.nativeEvent.layout.width)
              }
            >
              {nameWraps ? (
                name
              ) : (
                <View style={styles.nameRow}>
                  {name}
                  {editButton}
                </View>
              )}
              <AppText variant="overline" numberOfLines={2} style={styles.bio}>
                {user?.email}
              </AppText>
              {nameWraps && editButton}
              {statsBeside && statsRow}
            </View>
          </View>
          {!statsBeside && statsRow}
        </Card>

        <Card>
          <SectionTitle
            variant="heading"
            title={t('profile.styles')}
            aside={t('profile.seeAll')}
            onAside={openPreferences}
          />
          <AppText variant="overline">{t('profile.stylesOverline')}</AppText>
          {/* A summary: editing happens in "Mes préférences", never by accident. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('profile.styles')}
              accessibilityHint={t('preferences.open')}
              onPress={openPreferences}
              style={styles.row}
            >
              {preferredStyles.length === 0 ? (
                <AppText variant="hint">{t('profile.empty')}</AppText>
              ) : (
                preferredStyles.map((style) => (
                  <Chip
                    key={style}
                    selected
                    readOnly
                    icon={styleIcons[style]}
                    label={t(`wardrobe.styles.${style}`)}
                  />
                ))
              )}
            </Pressable>
          </ScrollView>
        </Card>

        <Card>
          <SectionTitle
            variant="heading"
            title={t('profile.colors')}
            aside={t('profile.seeAll')}
            onAside={openPreferences}
          />
          <AppText variant="overline">{t('profile.colorsOverline')}</AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('profile.colors')}
              accessibilityHint={t('preferences.open')}
              onPress={openPreferences}
              style={styles.swatches}
            >
              {preferredColors.map((color) => (
                <View key={color} style={styles.swatchCell}>
                  <View
                    style={[styles.swatch, { backgroundColor: COLORS[color] }]}
                  />
                  <AppText style={styles.swatchLabel} numberOfLines={2}>
                    {t(`wardrobe.colors.${color}`)}
                  </AppText>
                </View>
              ))}
              <View style={styles.swatchCell}>
                <View style={[styles.swatch, styles.addSwatch]}>
                  <Ionicons name="add" size={24} color={colors.title} />
                </View>
                <AppText style={styles.swatchLabel}>{t('profile.add')}</AppText>
              </View>
            </Pressable>
          </ScrollView>
        </Card>

        <View style={styles.stackedCards}>
          <Card>
            <AppText variant="heading">{t('profile.metal')}</AppText>
            <AppText variant="overline">{t('profile.metalOverline')}</AppText>
            <MetalPicker
              value={metals}
              onChange={(preferredMetals) => save({ preferredMetals })}
            />
          </Card>
          <Card>
            <AppText variant="heading">{t('profile.units')}</AppText>
            <AppText variant="overline">{t('profile.unitsOverline')}</AppText>
            <View style={styles.segmented} accessibilityRole="radiogroup">
              {TEMPERATURE_UNITS.map((value) => {
                const selected = value === unit;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t(`weather.units.${value}`)}
                    onPress={() => setUnit(value)}
                    style={[styles.segment, selected && styles.segmentOn]}
                  >
                    <AppText
                      style={[
                        styles.segmentText,
                        selected && styles.segmentTextOn,
                      ]}
                    >
                      {value === 'celsius' ? '°C' : '°F'}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Notifications come later: shown, off, and "coming soon" on press. */}
        <Card>
          <AppText variant="heading">{t('profile.notifications')}</AppText>
          <AppText variant="overline">
            {t('profile.notificationsOverline')}
          </AppText>
          <ToggleRow
            icon="bell-outline"
            label={t('profile.tips')}
            onPress={soon}
          />
          <View style={styles.separator} />
          <ToggleRow
            icon="hanger"
            label={t('profile.reminders')}
            onPress={soon}
          />
        </Card>

        <Card style={styles.menu}>
          <MenuRow
            icon="heart-outline"
            label={t('profile.favoriteOutfits')}
            onPress={() => router.push('/my-outfits')}
          />
          <View style={styles.separator} />
          <MenuRow
            icon="hanger"
            label={t('profile.favoritePieces')}
            onPress={() => router.push('/favorite-pieces')}
          />
          <View style={styles.separator} />
          <MenuRow
            icon="history"
            label={t('profile.history')}
            onPress={() => router.push('/history')}
          />
        </Card>

        <Card style={styles.menu}>
          <MenuRow
            icon="cog-outline"
            label={t('preferences.open')}
            onPress={openPreferences}
          />
          <View style={styles.separator} />
          <MenuRow
            icon="weather-partly-cloudy"
            label={t('weather.open')}
            onPress={() => router.push('/weather-settings')}
          />
          <View style={styles.separator} />
          <MenuRow
            icon="shield-check-outline"
            label={t('profile.privacy')}
            onPress={() => router.push('/privacy')}
          />
          <View style={styles.separator} />
          <MenuRow
            icon="help-circle-outline"
            label={t('profile.help')}
            onPress={soon}
          />
        </Card>

        <Button
          variant="secondary"
          icon="log-out-outline"
          label={t('auth.logout.action')}
          onPress={() => setDialog('logout')}
        />
      </ScrollPage>
      <ConfirmDialog
        visible={dialog === 'logout'}
        icon="log-out-outline"
        title={t('auth.logout.confirmTitle')}
        message={t('auth.logout.confirmBody')}
        confirmLabel={t('auth.logout.action')}
        cancelLabel={t('common.cancel')}
        loading={signingOut}
        onConfirm={() => {
          setSigningOut(true);
          // Unmounts this screen once the session is cleared.
          void signOut();
        }}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        visible={dialog === 'soon'}
        icon="sparkles-outline"
        title={t('comingSoon.title')}
        message={t('comingSoon.body')}
        confirmLabel={t('profile.ok')}
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Icon, then the value over its label; "reversed" puts the label first. */
function Stat({
  icon,
  value,
  label,
  accent = false,
  reversed = false,
}: {
  icon: IconName;
  value: string;
  label: string;
  accent?: boolean;
  reversed?: boolean;
}) {
  const valueText = (
    <AppText
      style={[styles.statValue, accent && styles.statAccent]}
      numberOfLines={accent ? 2 : 1}
    >
      {value}
    </AppText>
  );
  const labelText = <AppText style={styles.statLabel}>{label}</AppText>;
  return (
    <View
      style={[styles.stat, reversed && styles.statWide]}
      accessible
      accessibilityLabel={`${value} ${label}`}
    >
      <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      <View style={styles.flex}>
        {reversed ? labelText : valueText}
        {reversed ? valueText : labelText}
      </View>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: false, disabled: true }}
      onPress={onPress}
      style={styles.menuRow}
    >
      <MaterialCommunityIcons name={icon} size={22} color={colors.title} />
      <AppText style={styles.toggleLabel}>{label}</AppText>
      <View pointerEvents="none">
        <Switch
          value={false}
          disabled
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
    </Pressable>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={colors.title} />
      <AppText style={styles.menuLabel}>{label}</AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.title} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: spacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  name: { flexShrink: 1, fontSize: 30, lineHeight: 34 },
  bio: { fontSize: 10, lineHeight: 15, letterSpacing: 1.6 },
  pencil: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
  },
  editButton: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  editText: { fontFamily: fonts.serif, fontSize: 15, color: colors.primary },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  statsBelow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statWide: { flex: 1.4 },
  statValue: {
    fontFamily: fonts.serif,
    fontSize: 18,
    lineHeight: 21,
    color: colors.title,
  },
  statLabel: { fontSize: 11, lineHeight: 13, color: colors.body },
  statAccent: { fontSize: 12, lineHeight: 14, color: colors.link },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  // Rows scrolling to the card edges.
  bleed: { marginHorizontal: -spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  swatches: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  swatchCell: { width: 66, alignItems: 'center', gap: spacing.xs },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addSwatch: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  swatchLabel: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontFamily: fonts.serifRegular,
    fontSize: 13,
    lineHeight: 16,
    color: colors.title,
  },
  // Stacked: side by side, the three metal swatches never fit on a phone.
  stackedCards: { gap: spacing.lg },
  flex: { flex: 1 },
  segmented: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    borderRadius: radii.input,
    backgroundColor: colors.input,
  },
  segment: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.input,
  },
  segmentOn: { backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.serif, fontSize: 18, color: colors.title },
  segmentTextOn: { color: colors.onPrimary },
  menu: { gap: 0, paddingVertical: spacing.xs },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget + 4,
  },
  menuLabel: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.title,
  },
  toggleLabel: { flex: 1, fontSize: 15, lineHeight: 20, color: colors.body },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  pressed: { opacity: 0.7 },
});
