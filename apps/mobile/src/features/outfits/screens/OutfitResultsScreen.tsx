import type { Outfit } from '@klotho/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, spacing } from '@/theme/tokens';

import { OutfitCard } from '../components/OutfitCard';
import { useGenerateOutfits, useOutfitList } from '../hooks/useOutfits';

/** The 5 proposals; "Générer d'autres idées" leaves out those already seen. */
export function OutfitResultsScreen() {
  const { t } = useTranslation();
  const { ids = '' } = useLocalSearchParams<{ ids?: string }>();
  const outfitIds = ids.split(',').filter(Boolean);
  const queries = useOutfitList(outfitIds);
  const again = useGenerateOutfits();

  const outfits = queries
    .map((query) => query.data)
    .filter((outfit): outfit is Outfit => outfit !== undefined);
  const loading = queries.some((query) => query.isPending);
  const failed = queries.find((query) => query.isError);
  const first = outfits[0];

  const regenerate = () => {
    if (!first) return;
    again.mutate(
      {
        style: first.style,
        occasion: first.occasion,
        temperature: first.temperature,
        condition: first.condition,
        excludeOutfitIds: outfitIds,
      },
      {
        onSuccess: (next) =>
          router.replace({
            pathname: '/outfits/results',
            params: { ids: next.map((o) => o.id).join(',') },
          }),
      },
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('outfits.results.title')}
          overline={t('outfits.results.overline', { count: outfits.length })}
        />
        {loading && outfits.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : failed && outfits.length === 0 ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t('outfits.details.notFound')}
            body={t(errorMessageKey(failed.error) as 'apiErrors.unknown')}
            actionLabel={t('common.retry')}
            onAction={() => queries.forEach((q) => void q.refetch())}
          />
        ) : (
          outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              onPress={() => router.push(`/outfits/${outfit.id}`)}
            />
          ))
        )}
      </ScrollPage>
      {first && (
        <View style={styles.footer}>
          <FormError
            message={
              again.error
                ? t(errorMessageKey(again.error) as 'apiErrors.unknown')
                : null
            }
          />
          <Button
            variant="outline"
            icon="refresh"
            label={t('outfits.results.again')}
            loading={again.isPending}
            onPress={regenerate}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  loader: { marginTop: spacing.xxxl },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
