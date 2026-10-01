import { Ionicons } from '@expo/vector-icons';
import { STYLES, type Style, type StyleProfile } from '@klotho/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { errorMessageKey } from '@/lib/api/errors';
import { useCompactLayout } from '@/theme/useCompactLayout';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

import { StyleCard } from '../components/StyleCards';
import {
  toFields,
  useSaveStyleProfile,
  useStyleProfile,
} from '../hooks/useStyleProfile';
import { matches } from '../lib/search';

/** "Tous les styles", as on the mockup. */
export function AllStylesScreen() {
  const profile = useStyleProfile();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {profile.data ? (
        <StylesForm profile={profile.data} />
      ) : (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      )}
    </SafeAreaView>
  );
}

function StylesForm({ profile }: { profile: StyleProfile }) {
  const { t } = useTranslation();
  const save = useSaveStyleProfile();
  const [chosen, setChosen] = useState<Style[]>(profile.preferredStyles);
  const [search, setSearch] = useState('');
  const columns = useCompactLayout() ? 3 : 4;
  const shown = STYLES.filter((style) =>
    matches(t(`wardrobe.styles.${style}`), search),
  );

  const toggle = (style: Style) =>
    setChosen((list) =>
      list.includes(style) ? list.filter((s) => s !== style) : [...list, style],
    );

  return (
    <>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('settings.allStyles.title')}
          overline={t('settings.allStyles.overline')}
        />
        <View style={styles.search}>
          <Ionicons name="search-outline" size={20} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('settings.allStyles.search')}
            placeholderTextColor={colors.placeholder}
            accessibilityLabel={t('settings.allStyles.search')}
            maxFontSizeMultiplier={1.2}
            style={styles.searchInput}
          />
        </View>
        {shown.length === 0 ? (
          <AppText center variant="hint">
            {t('settings.allStyles.noResult')}
          </AppText>
        ) : (
          <View style={styles.grid}>
            {shown.map((style) => (
              <View
                key={style}
                // Just under 1/n: rounding must not push a card to the next row.
                style={[styles.cell, { width: `${100 / columns - 0.1}%` }]}
              >
                <StyleCard
                  style={style}
                  label={t(`wardrobe.styles.${style}`)}
                  selected={chosen.includes(style)}
                  onPress={() => toggle(style)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollPage>
      <View style={styles.footer}>
        <FormError
          message={
            save.error
              ? t(errorMessageKey(save.error) as 'apiErrors.unknown')
              : null
          }
        />
        <Button
          label={t('settings.allStyles.submit')}
          loading={save.isPending}
          onPress={() =>
            save.mutate(
              { ...toFields(profile), preferredStyles: chosen },
              { onSuccess: () => router.back() },
            )
          }
        />
      </View>
    </>
  );
}

const GAP = spacing.sm;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxxl },
  content: {
    gap: spacing.lg,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -GAP / 2,
  },
  cell: { padding: GAP / 2 },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
