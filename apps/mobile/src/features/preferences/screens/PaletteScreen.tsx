import { Ionicons } from '@expo/vector-icons';
import {
  COLOR_FAMILIES,
  COLOR_FAMILY_KEYS,
  COLOR_KEYS,
  COLORS,
  type ColorFamily,
  type ColorKey,
  type StyleProfile,
} from '@klotho/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { errorMessageKey } from '@/lib/api/errors';
import { photos } from '@/theme/photos';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

import {
  toFields,
  useSaveStyleProfile,
  useStyleProfile,
} from '../hooks/useStyleProfile';
import { matches } from '../lib/search';

const ALL = 'all';
const CLEAR = 'rgba(251, 247, 242, 0)';

/** "Palette complète", as on the mockup. */
export function PaletteScreen() {
  const profile = useStyleProfile();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {profile.data ? (
        <PaletteForm profile={profile.data} />
      ) : (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      )}
    </SafeAreaView>
  );
}

function PaletteForm({ profile }: { profile: StyleProfile }) {
  const { t } = useTranslation();
  const save = useSaveStyleProfile();
  const [favorites, setFavorites] = useState<ColorKey[]>(
    profile.preferredColors,
  );
  const [family, setFamily] = useState<ColorFamily | typeof ALL>(ALL);
  const [search, setSearch] = useState('');

  const name = (color: ColorKey) => t(`wardrobe.colors.${color}`);
  const inFamily =
    family === ALL
      ? COLOR_KEYS
      : (Object.keys(COLOR_FAMILIES[family]) as ColorKey[]);
  const shown = inFamily.filter((color) => matches(name(color), search));

  const toggleFavorite = (color: ColorKey) =>
    setFavorites((list) =>
      list.includes(color) ? list.filter((c) => c !== color) : [...list, color],
    );

  return (
    <>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('settings.palette.title')}
          overline={t('settings.palette.overline')}
        />
        <AppText center>{t('settings.palette.body')}</AppText>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={20} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('settings.palette.search')}
            placeholderTextColor={colors.placeholder}
            accessibilityLabel={t('settings.palette.search')}
            maxFontSizeMultiplier={1.2}
            style={styles.searchInput}
          />
        </View>
        <ChipGroup<ColorFamily | typeof ALL>
          options={(['all', ...COLOR_FAMILY_KEYS] as const).map((value) => ({
            value,
            label: t(`wardrobe.colorFamilies.${value}`),
          }))}
          value={family}
          onChange={(next) => setFamily(next ?? ALL)}
        />

        <SectionHeader
          title={t('settings.palette.all')}
          hint={t('settings.palette.allHint')}
        />
        {shown.length === 0 ? (
          <AppText variant="hint" center>
            {t('settings.palette.noResult')}
          </AppText>
        ) : (
          <View style={styles.grid}>
            {shown.map((color) => (
              <Swatch
                key={color}
                color={color}
                label={name(color)}
                selected={favorites.includes(color)}
                accessibilityLabel={
                  favorites.includes(color)
                    ? t('settings.palette.favorite', { color: name(color) })
                    : name(color)
                }
                onPress={() => toggleFavorite(color)}
              />
            ))}
          </View>
        )}
      </ScrollPage>

      <View style={styles.footer}>
        {/* The decor behind the button, as on the mockup. */}
        <Image
          source={photos.passwordFooter.source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <LinearGradient
          colors={[colors.background, CLEAR]}
          locations={[0, 0.6]}
          style={StyleSheet.absoluteFill}
        />
        <FormError
          message={
            save.error
              ? t(errorMessageKey(save.error) as 'apiErrors.unknown')
              : null
          }
        />
        <Button
          label={t('settings.palette.submit')}
          loading={save.isPending}
          onPress={() =>
            save.mutate(
              {
                ...toFields(profile),
                preferredColors: favorites,
                // A favourite is never also a colour to avoid.
                avoidedColors: profile.avoidedColors.filter(
                  (color) => !favorites.includes(color),
                ),
              },
              { onSuccess: () => router.back() },
            )
          }
        />
      </View>
    </>
  );
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="overline" style={styles.sectionTitle}>
        {title}
      </AppText>
      <AppText style={styles.sectionHint}>{hint}</AppText>
    </View>
  );
}

function Swatch({
  color,
  label,
  selected,
  accessibilityLabel,
  onPress,
}: {
  color: ColorKey;
  label: string;
  selected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
    >
      <View style={[styles.swatch, { backgroundColor: COLORS[color] }]}>
        {selected && (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={13} color={colors.onPrimary} />
          </View>
        )}
      </View>
      <AppText
        numberOfLines={2}
        maxFontSizeMultiplier={1.1}
        style={styles.swatchLabel}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const SWATCH = 54;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxxl },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  search: {
    minHeight: touchTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  searchInput: {
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: 0,
    textAlignVertical: 'center',
    fontFamily: fonts.serifRegular,
    fontSize: 16,
    color: colors.title,
  },
  sectionHeader: { gap: 2, marginTop: spacing.sm },
  sectionTitle: { color: colors.title },
  sectionHint: {
    fontFamily: fonts.serifRegular,
    fontSize: 13,
    color: colors.link,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  // Just under 1/5: rounded to the pixel, five 20 % cells may not fit a row.
  cell: { width: '19.9%', alignItems: 'center', gap: spacing.xs },
  pressed: { opacity: 0.7 },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  check: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.onPrimary,
    backgroundColor: colors.primary,
  },
  swatchLabel: {
    textAlign: 'center',
    fontFamily: fonts.serifRegular,
    fontSize: 13,
    lineHeight: 16,
    color: colors.title,
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
});
