import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Outfit } from '@klotho/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ItemVisual } from '@/features/wardrobe/components/ItemVisual';
import { itemTitle } from '@/features/wardrobe/labels';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, radii, spacing } from '@/theme/tokens';

import { OutfitCollage } from '../components/OutfitCollage';
import { useCreateVariant, useOutfit } from '../hooks/useOutfits';

/** Kept by default: the base of the look (bottom or dress) and its layer. */
const KEPT_BY_DEFAULT = ['bottom', 'dress', 'layer'];

/** "Créer une variante": keep some pieces, vary the rest. */
export function OutfitVariantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const outfit = useOutfit(id);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {outfit.data ? (
        <Variant original={outfit.data} />
      ) : (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      )}
    </SafeAreaView>
  );
}

function Variant({ original }: { original: Outfit }) {
  const { t } = useTranslation();
  const create = useCreateVariant(original.id);
  const [locked, setLocked] = useState<string[]>(() =>
    original.pieces
      .filter((piece) => KEPT_BY_DEFAULT.includes(piece.role))
      .map((piece) => piece.item.id),
  );
  const [seen, setSeen] = useState<string[]>([]);
  const variant = create.data;

  const generate = (exclude: string[]) =>
    create.mutate(
      { lockedItemIds: locked, excludeOutfitIds: exclude },
      { onSuccess: (next) => setSeen((ids) => [...ids, next.id]) },
    );

  // A first variant straight away, as on the mockup.
  useEffect(() => {
    generate([]);
    // Only once, when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (itemId: string) =>
    setLocked((ids) =>
      ids.includes(itemId) ? ids.filter((i) => i !== itemId) : [...ids, itemId],
    );

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('outfits.variant.title')}
          overline={t('outfits.variant.overline')}
        />

        <LookCard
          title={t('outfits.variant.original')}
          outfit={original}
          onSee={() => router.back()}
        />

        <View style={styles.section}>
          <AppText variant="overline">{t('outfits.variant.keep')}</AppText>
          <AppText variant="hint">{t('outfits.variant.keepHint')}</AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {original.pieces.map(({ role, item }) => {
              const kept = locked.includes(item.id);
              return (
                <Pressable
                  key={role}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: kept }}
                  accessibilityLabel={itemTitle(t, item)}
                  onPress={() => toggle(item.id)}
                  style={[styles.thumb, kept && styles.thumbKept]}
                >
                  <ItemVisual
                    category={item.category}
                    color={item.primaryColor}
                    photo={item.photos[0]}
                  />
                  <View style={[styles.lock, kept && styles.lockKept]}>
                    <MaterialCommunityIcons
                      name={kept ? 'lock-outline' : 'lock-open-variant-outline'}
                      size={13}
                      color={kept ? colors.onPrimary : colors.muted}
                    />
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <Ionicons
          name="arrow-down"
          size={20}
          color={colors.muted}
          style={styles.arrow}
        />

        {variant ? (
          <LookCard
            title={t('outfits.variant.new')}
            outfit={variant}
            highlighted
            onSee={() => router.push(`/outfits/${variant.id}`)}
          />
        ) : create.isPending ? (
          <View style={styles.pending}>
            <ActivityIndicator color={colors.primary} />
            <AppText variant="hint">{t('outfits.variant.generating')}</AppText>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <FormError
          message={
            create.error
              ? t(errorMessageKey(create.error) as 'apiErrors.unknown')
              : null
          }
        />
        {variant && (
          <Button
            label={t('outfits.variant.save')}
            onPress={() => router.replace(`/outfits/${variant.id}`)}
          />
        )}
        <Button
          variant="outline"
          icon="refresh"
          label={t('outfits.variant.again')}
          loading={create.isPending}
          onPress={() => generate(seen)}
        />
      </View>
    </>
  );
}

function LookCard({
  title,
  outfit,
  highlighted = false,
  onSee,
}: {
  title: string;
  outfit: Outfit;
  highlighted?: boolean;
  onSee: () => void;
}) {
  const { t } = useTranslation();
  const why = outfit.highlights[0];
  return (
    <View style={styles.card}>
      <View style={styles.cardText}>
        <View style={styles.inline}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <AppText variant="heading" style={[styles.flex, styles.lookTitle]}>
            {title}
          </AppText>
        </View>
        {outfit.style && (
          <AppText variant="overline">
            {t(`wardrobe.styles.${outfit.style}`)}
          </AppText>
        )}
        {why && (
          <AppText style={styles.lookWhy}>
            {t(`outfits.highlights.${why}`)}
          </AppText>
        )}
        <Button
          variant={highlighted ? 'primary' : 'outline'}
          decorated={false}
          label={t('outfits.variant.see')}
          onPress={onSee}
        />
      </View>
      <View style={styles.collage}>
        <OutfitCollage pieces={outfit.pieces} />
      </View>
    </View>
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
  section: { gap: spacing.sm },
  lookTitle: { fontSize: 21, lineHeight: 26 },
  lookWhy: { fontSize: 15, lineHeight: 21 },
  row: { gap: spacing.sm },
  thumb: {
    width: 68,
    overflow: 'hidden',
    borderRadius: radii.input - 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    opacity: 0.6,
  },
  thumbKept: { borderColor: colors.primary, opacity: 1 },
  lock: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  lockKept: { backgroundColor: colors.primary },
  arrow: { alignSelf: 'center' },
  pending: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardText: { flex: 1, gap: spacing.sm },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flex: { flex: 1 },
  collage: { width: '44%' },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
