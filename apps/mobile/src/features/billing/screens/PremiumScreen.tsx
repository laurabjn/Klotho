import { Ionicons } from '@expo/vector-icons';
import { PRODUCTS, type BillingStatus } from '@klotho/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { showToast } from '@/components/ui/Toast';
import { errorMessageKey } from '@/lib/api/errors';
import { formatDay } from '@/lib/days';
import { photos } from '@/theme/photos';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import {
  useBillingStatus,
  usePurchase,
  useRestorePurchases,
  useStorePackages,
} from '../hooks/useBilling';
import { MANAGE_SUBSCRIPTIONS_URL, purchasesAvailable } from '../lib/purchases';

const CLEAR = 'rgba(251, 247, 242, 0)';

type PlanChoice = 'annual' | 'monthly' | 'founders';
const PLAN_PRODUCTS: Record<PlanChoice, string> = {
  annual: PRODUCTS.premiumAnnual,
  monthly: PRODUCTS.premiumMonthly,
  founders: PRODUCTS.founders,
};
const PACKS = [
  { product: PRODUCTS.credits25, count: 25 },
  { product: PRODUCTS.credits75, count: 75 },
];

/** "Klotho Premium": what each plan includes, the offers and the credits. */
export function PremiumScreen() {
  const { t, i18n } = useTranslation();
  const status = useBillingStatus();
  const store = useStorePackages();
  const purchase = usePurchase();
  const restore = useRestorePurchases();
  const [choice, setChoice] = useState<PlanChoice>('annual');

  const plan = status.data?.plan ?? 'free';
  const paid = plan !== 'free';
  const price = (product: string, fallback: string) =>
    store.data?.get(product)?.product.priceString ?? fallback;
  const buy = (product: string) => {
    const pack = store.data?.get(product);
    if (!pack) return;
    purchase.mutate(pack, {
      onSuccess: (done) => done && showToast(t('billing.thanks'), 'sparkles'),
    });
  };
  const error = purchase.error ?? restore.error;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('billing.title')}
          overline={t('billing.overline')}
        />
        <View
          style={[styles.hero, { aspectRatio: photos.welcome.ratio }]}
          importantForAccessibility="no-hide-descendants"
        >
          <Image
            source={photos.welcome.source}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={[CLEAR, CLEAR, colors.background]}
            locations={[0, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <AppText center>{t('billing.intro')}</AppText>

        {status.data && <Comparison status={status.data} />}

        {paid ? (
          <View style={styles.current} accessibilityLiveRegion="polite">
            <Ionicons name="sparkles" size={22} color={colors.primary} />
            <AppText style={styles.currentText}>
              {plan === 'founders'
                ? t('billing.current.founders')
                : t('billing.current.premium', {
                    date: formatDay(
                      (status.data?.expiresAt ?? '').slice(0, 10),
                      i18n.language,
                    ),
                  })}
            </AppText>
            {plan === 'premium' && (
              <Button
                variant="link"
                decorated={false}
                label={t('billing.current.manage')}
                onPress={() => void Linking.openURL(MANAGE_SUBSCRIPTIONS_URL)}
              />
            )}
          </View>
        ) : (
          <View style={styles.plans} accessibilityRole="radiogroup">
            <PlanCard
              selected={choice === 'annual'}
              title={t('billing.plans.annual')}
              price={price(
                PRODUCTS.premiumAnnual,
                t('billing.plans.annualPrice'),
              )}
              hint={t('billing.plans.annualHint')}
              badge={t('billing.plans.save')}
              onPress={() => setChoice('annual')}
            />
            <PlanCard
              selected={choice === 'monthly'}
              title={t('billing.plans.monthly')}
              price={price(
                PRODUCTS.premiumMonthly,
                t('billing.plans.monthlyPrice'),
              )}
              hint={t('billing.plans.monthlyHint')}
              onPress={() => setChoice('monthly')}
            />
            <PlanCard
              selected={choice === 'founders'}
              title={t('billing.plans.founders')}
              price={price(PRODUCTS.founders, t('billing.plans.foundersPrice'))}
              hint={t('billing.plans.foundersHint')}
              badge={t('billing.plans.foundersBadge')}
              onPress={() => setChoice('founders')}
            />
          </View>
        )}

        <FormError
          message={
            error ? t(errorMessageKey(error) as 'apiErrors.unknown') : null
          }
        />
        {!purchasesAvailable && (
          <AppText variant="hint" center>
            {t('billing.unavailable')}
          </AppText>
        )}
        {!paid && (
          <Button
            label={t('billing.subscribe')}
            loading={purchase.isPending}
            disabled={!store.data?.has(PLAN_PRODUCTS[choice])}
            onPress={() => buy(PLAN_PRODUCTS[choice])}
          />
        )}

        <View style={styles.credits}>
          <AppText variant="heading" style={styles.creditsTitle}>
            {t('billing.credits.title')}
          </AppText>
          <AppText style={styles.small}>{t('billing.credits.body')}</AppText>
          {status.data?.credits.enabled && (
            <AppText variant="hint">
              {t('ai.card.remaining', {
                count: status.data.credits.remaining,
              })}
            </AppText>
          )}
          <View style={styles.packs}>
            {PACKS.map(({ product, count }) => (
              <View key={product} style={styles.pack}>
                <Ionicons
                  name="sparkles-outline"
                  size={20}
                  color={colors.primary}
                />
                <AppText style={styles.packTitle}>
                  {t('billing.credits.pack', { count })}
                </AppText>
                <AppText variant="hint">{price(product, '')}</AppText>
                <Button
                  variant="secondary"
                  decorated={false}
                  label={t('billing.credits.buy')}
                  disabled={!store.data?.has(product) || purchase.isPending}
                  onPress={() => buy(product)}
                />
              </View>
            ))}
          </View>
        </View>

        <Button
          variant="link"
          decorated={false}
          label={t('billing.restore')}
          disabled={!purchasesAvailable || restore.isPending}
          onPress={() =>
            restore.mutate(undefined, {
              onSuccess: () => showToast(t('billing.restored')),
            })
          }
        />
        <AppText variant="hint" center>
          {t('billing.legal', {
            store: t(
              Platform.OS === 'ios'
                ? 'billing.stores.ios'
                : 'billing.stores.android',
            ),
          })}
        </AppText>
        <View style={styles.links}>
          <Button
            variant="link"
            decorated={false}
            label={t('billing.terms')}
            onPress={() => router.push('/terms')}
          />
          <Button
            variant="link"
            decorated={false}
            label={t('billing.privacy')}
            onPress={() => router.push('/privacy')}
          />
        </View>
      </ScrollPage>
    </SafeAreaView>
  );
}

/** Free and Premium side by side, with the limits the server applies. */
function Comparison({ status }: { status: BillingStatus }) {
  const { t } = useTranslation();
  const unlimited = t('billing.compare.unlimited');
  const { free, freeAnalyses, premiumMonthlyAnalyses } = status.offer;
  const rows = [
    {
      label: t('billing.compare.pieces'),
      free: free.pieces === null ? unlimited : String(free.pieces),
      premium: unlimited,
    },
    {
      label: t('billing.compare.generations'),
      free:
        free.generationsPerWeek === null
          ? unlimited
          : t('billing.compare.generationsFree', {
              count: free.generationsPerWeek,
            }),
      premium: unlimited,
    },
    {
      label: t('billing.compare.history'),
      free:
        free.historyDays === null
          ? t('billing.compare.historyPremium')
          : t('billing.compare.historyFree', { count: free.historyDays }),
      premium: t('billing.compare.historyPremium'),
    },
    {
      label: t('billing.compare.analyses'),
      free: t('billing.compare.analysesFree', { count: freeAnalyses }),
      premium: t('billing.compare.analysesPremium', {
        count: premiumMonthlyAnalyses,
      }),
    },
  ];
  return (
    <View style={styles.table}>
      <View style={styles.tableRow}>
        <View style={styles.tableLabel} />
        <AppText style={styles.tableHead}>{t('billing.compare.free')}</AppText>
        <AppText style={[styles.tableHead, styles.tablePremium]}>
          {t('billing.compare.premium')}
        </AppText>
      </View>
      {rows.map((row) => (
        <View
          key={row.label}
          style={[styles.tableRow, styles.tableLine]}
          accessible
          accessibilityLabel={`${row.label} : ${t('billing.compare.free')} ${row.free}, ${t('billing.compare.premium')} ${row.premium}`}
        >
          <AppText style={styles.tableLabel}>{row.label}</AppText>
          <AppText style={styles.tableValue}>{row.free}</AppText>
          <AppText style={[styles.tableValue, styles.tablePremium]}>
            {row.premium}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function PlanCard({
  selected,
  title,
  price,
  hint,
  badge,
  onPress,
}: {
  selected: boolean;
  title: string;
  price: string;
  hint: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}, ${price}. ${hint}`}
      onPress={onPress}
      style={[styles.planCard, selected && styles.planSelected]}
    >
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? colors.primary : colors.muted}
      />
      <View style={styles.planText}>
        <View style={styles.planTitleRow}>
          <AppText style={styles.planTitle}>{title}</AppText>
          {badge && (
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>{badge}</AppText>
            </View>
          )}
        </View>
        <AppText style={styles.planPrice}>{price}</AppText>
        <AppText variant="hint">{hint}</AppText>
      </View>
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
  hero: {
    marginHorizontal: -spacing.xl,
    overflow: 'hidden',
  },
  table: {
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tableLine: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tableLabel: { flex: 1.4, fontSize: 15, lineHeight: 20, color: colors.title },
  tableHead: {
    flex: 1,
    textAlign: 'center',
    paddingBottom: spacing.sm,
    fontFamily: fonts.serifSemiBold,
    fontSize: 16,
    color: colors.title,
  },
  tableValue: { flex: 1, textAlign: 'center', fontSize: 14, lineHeight: 19 },
  tablePremium: { color: colors.primary },
  plans: { gap: spacing.sm },
  planCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  planSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  planText: { flex: 1, gap: 2 },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  planTitle: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 19,
    color: colors.title,
  },
  planPrice: { fontFamily: fonts.serif, fontSize: 17, color: colors.title },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  badgeText: { fontSize: 12, lineHeight: 16, color: colors.onPrimary },
  current: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.primaryLight,
  },
  currentText: { textAlign: 'center', color: colors.title },
  credits: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  creditsTitle: { fontSize: 20, lineHeight: 25 },
  small: { fontFamily: fonts.serifRegular, fontSize: 15, lineHeight: 21 },
  packs: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  pack: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.input,
    backgroundColor: colors.input,
  },
  packTitle: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 17,
    color: colors.title,
  },
  links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
});
