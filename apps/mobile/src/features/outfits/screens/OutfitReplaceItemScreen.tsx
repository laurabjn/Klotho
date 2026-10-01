import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Outfit, OutfitRole, WardrobeItem } from '@klotho/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ItemVisual } from '@/features/wardrobe/components/ItemVisual';
import { itemTitle, subcategoryLabel } from '@/features/wardrobe/labels';
import { errorMessageKey } from '@/lib/api/errors';
import { categoryIcons, styleIcons } from '@/theme/icons';
import { colors, fonts, radii, spacing } from '@/theme/tokens';
import { useCompactLayout } from '@/theme/useCompactLayout';

import {
  useOutfit,
  useOutfitAlternatives,
  useReplaceOutfitItem,
} from '../hooks/useOutfits';

/** Filter value showing every suggestion. */
const ALL = 'all';

/** "Remplacer une pièce": pick the piece, then one of the suggestions. */
export function OutfitReplaceItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const outfit = useOutfit(id);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {outfit.data ? (
        <Replace outfit={outfit.data} />
      ) : (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      )}
    </SafeAreaView>
  );
}

function Replace({ outfit }: { outfit: Outfit }) {
  const { t } = useTranslation();
  const [role, setRole] = useState<OutfitRole>(
    outfit.pieces.find((p) => p.role === 'shoes')?.role ??
      outfit.pieces[0]!.role,
  );
  const [chosen, setChosen] = useState<WardrobeItem | null>(null);
  const alternatives = useOutfitAlternatives(outfit.id, role);
  const replace = useReplaceOutfitItem(outfit.id);
  const columns = useCompactLayout() ? 2 : 3;
  const current = outfit.pieces.find((p) => p.role === role)?.item;
  const [kind, setKind] = useState<string>(ALL);
  // Thumbnails of the look: five on the card's width, as on the mockup.
  const { width } = useWindowDimensions();
  const thumbWidth = Math.max(
    56,
    (width - 2 * spacing.xl - 2 * spacing.lg - 4 * spacing.sm) / 5,
  );

  // "Toutes", then each kind of piece among the suggestions (Escarpins…).
  const kinds = [
    ...new Set(
      (alternatives.data ?? []).flatMap(({ item }) =>
        item.subcategory ? [item.subcategory] : [],
      ),
    ),
  ];
  const shown = (alternatives.data ?? []).filter(
    ({ item }) => kind === ALL || item.subcategory === kind,
  );

  const pickRole = (next: OutfitRole) => {
    setRole(next);
    setChosen(null);
    setKind(ALL);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('outfits.replace.title')}
          overline={t('outfits.replace.overline')}
        />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.flex}>
              <AppText variant="heading">
                {t('outfits.replace.current')}
              </AppText>
              {outfit.style && (
                <View style={styles.inline}>
                  <MaterialCommunityIcons
                    name={styleIcons[outfit.style]}
                    size={14}
                    color={colors.primary}
                  />
                  <AppText variant="overline">
                    {t(`wardrobe.styles.${outfit.style}`)}
                  </AppText>
                </View>
              )}
            </View>
            {current && (
              <View style={styles.replacing}>
                <MaterialCommunityIcons
                  name={categoryIcons[current.category]}
                  size={20}
                  color={colors.primary}
                />
                <View>
                  <AppText variant="hint">
                    {t('outfits.replace.replacing')}
                  </AppText>
                  <AppText style={styles.replacingRole}>
                    {t(`outfits.roles.${role}`)}
                  </AppText>
                </View>
              </View>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {outfit.pieces.map((piece) => (
              <Pressable
                key={piece.role}
                accessibilityRole="radio"
                accessibilityState={{ selected: piece.role === role }}
                accessibilityLabel={`${t(`outfits.roles.${piece.role}`)} : ${itemTitle(t, piece.item)}`}
                onPress={() => pickRole(piece.role)}
                style={[
                  styles.thumb,
                  { width: thumbWidth },
                  piece.role === role && styles.thumbSelected,
                ]}
              >
                <ItemVisual
                  category={piece.item.category}
                  color={piece.item.primaryColor}
                  photo={piece.item.photos[0]}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <AppText variant="heading">{t('outfits.replace.suggestions')}</AppText>
        {kinds.length > 1 && (
          <ChipGroup
            options={[
              { value: ALL, label: t('outfits.replace.all') },
              ...kinds.map((value) => ({
                value,
                label: subcategoryLabel(t, value),
              })),
            ]}
            value={kind}
            onChange={(next) => setKind(next ?? ALL)}
          />
        )}
        {alternatives.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : alternatives.data?.length === 0 ? (
          <EmptyState
            icon="shirt-outline"
            title={t('outfits.replace.none')}
            body=""
          />
        ) : (
          <View style={styles.grid}>
            {shown.map(({ item, compatible }) => {
              const selected = chosen?.id === item.id;
              const title = itemTitle(t, item);
              return (
                <View
                  key={item.id}
                  style={[styles.cell, { width: `${100 / columns}%` }]}
                >
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${title}, ${t(compatible ? 'outfits.replace.compatible' : 'outfits.replace.lessSuited')}`}
                    onPress={() => setChosen(item)}
                    style={[
                      styles.suggestion,
                      selected && styles.suggestionSelected,
                    ]}
                  >
                    <View>
                      <ItemVisual
                        category={item.category}
                        color={item.primaryColor}
                        photo={item.photos[0]}
                      />
                      {selected && (
                        <View style={styles.check}>
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={colors.onPrimary}
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.suggestionText}>
                      <AppText
                        numberOfLines={2}
                        maxFontSizeMultiplier={1.1}
                        style={styles.name}
                      >
                        {title}
                      </AppText>
                      <View
                        style={[styles.badge, !compatible && styles.badgeMuted]}
                      >
                        <Ionicons
                          name={
                            compatible
                              ? 'checkmark-circle-outline'
                              : 'alert-circle-outline'
                          }
                          size={13}
                          color={compatible ? colors.primary : colors.muted}
                        />
                        <AppText
                          numberOfLines={1}
                          maxFontSizeMultiplier={1}
                          style={[
                            styles.badgeText,
                            !compatible && styles.badgeTextMuted,
                          ]}
                        >
                          {t(
                            compatible
                              ? 'outfits.replace.compatible'
                              : 'outfits.replace.lessSuited',
                          )}
                        </AppText>
                      </View>
                      {item.styles[0] && (
                        <View style={styles.styleTag}>
                          <AppText numberOfLines={1} style={styles.styleText}>
                            {t(`wardrobe.styles.${item.styles[0]}`)}
                          </AppText>
                        </View>
                      )}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <FormError
          message={
            replace.error
              ? t(errorMessageKey(replace.error) as 'apiErrors.unknown')
              : null
          }
        />
        <Button
          label={t('outfits.replace.submit')}
          disabled={!chosen}
          loading={replace.isPending}
          onPress={() =>
            chosen &&
            replace.mutate(
              { role, replacementItemId: chosen.id },
              { onSuccess: () => router.back() },
            )
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxxl },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  replacing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.input,
    backgroundColor: colors.primaryLight,
  },
  replacingRole: { fontFamily: fonts.serif, fontSize: 16, color: colors.link },
  row: { gap: spacing.sm },
  thumb: {
    overflow: 'hidden',
    borderRadius: radii.input - 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  thumbSelected: { borderColor: colors.primary, borderStyle: 'dashed' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: { padding: 4 },
  suggestion: {
    overflow: 'hidden',
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  suggestionSelected: { borderColor: colors.primary, borderWidth: 1.5 },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  suggestionText: { gap: spacing.xs, padding: spacing.sm },
  name: {
    fontFamily: fonts.serif,
    fontSize: 14,
    lineHeight: 18,
    color: colors.title,
  },
  badge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  badgeMuted: { backgroundColor: colors.input },
  // Wraps instead of being cut ("Moins assortie" in a narrow column).
  badgeText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    color: colors.link,
  },
  badgeTextMuted: { color: colors.muted },
  styleTag: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  styleText: { fontSize: 12, lineHeight: 16, color: colors.muted },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
