import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  Hairstyle,
  LookSuggestion,
  MakeupLook,
  StyleProfileFields,
} from '@klotho/shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useBillingStatus } from '@/features/billing/hooks/useBilling';
import { useStyleProfile } from '@/features/preferences/hooks/useStyleProfile';
import { lookPhotos } from '@/theme/photos';
import type { IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { useCompleteLook } from '../hooks/useOutfits';

const ART_SIZE = 72;

/** What "Le look complet" knows of her hair and her taste for makeup. */
const PROFILE_FIELDS: (keyof StyleProfileFields)[] = [
  'hairLength',
  'hairTexture',
  'makeupPreference',
];

/**
 * "Le look complet" (Premium): a hairstyle and a makeup look for the
 * outfit; a teaser on the free plan, while payments are on.
 */
export function CompleteLookCard({ outfitId }: { outfitId: string }) {
  const billing = useBillingStatus();
  if (!billing.data) return null;
  const locked = billing.data.enabled && billing.data.plan === 'free';
  return locked ? <Teaser /> : <Suggestions outfitId={outfitId} />;
}

function Teaser() {
  const { t } = useTranslation();
  return (
    <View style={styles.card} testID="complete-look-teaser">
      <Header />
      <View style={styles.teaser}>
        <View style={styles.lock}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">{t('looks.teaserTitle')}</AppText>
          <AppText>{t('looks.teaserBody')}</AppText>
        </View>
      </View>
      <Button
        variant="outline"
        icon="sparkles-outline"
        label={t('looks.teaserCta')}
        onPress={() => router.push('/premium')}
      />
    </View>
  );
}

function Header() {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <AppText variant="overline">{t('looks.overline')}</AppText>
      <AppText variant="heading">{t('looks.title')}</AppText>
    </View>
  );
}

function Suggestions({ outfitId }: { outfitId: string }) {
  const { t } = useTranslation();
  const look = useCompleteLook(outfitId);
  const profile = useStyleProfile();
  const incomplete =
    !!profile.data &&
    PROFILE_FIELDS.some((field) => profile.data[field] === null);

  return (
    <View style={styles.card}>
      <Header />
      <AppText>{t('looks.intro')}</AppText>
      {look.isPending && <ActivityIndicator color={colors.primary} />}
      {look.isError && (
        <View style={styles.error}>
          <AppText variant="hint">{t('looks.error')}</AppText>
          <Button
            variant="link"
            label={t('looks.retry')}
            onPress={() => void look.refetch()}
          />
        </View>
      )}
      {look.data && (
        <>
          <Idea
            kind="hairstyle"
            suggestions={look.data.hairstyles}
            icon="hair-dryer-outline"
          />
          {look.data.makeups.length > 0 && (
            <Idea
              kind="makeup"
              suggestions={look.data.makeups}
              icon="lipstick"
            />
          )}
        </>
      )}
      {incomplete && (
        <View style={styles.hint}>
          <AppText variant="hint">{t('looks.profileHint')}</AppText>
          <Button
            variant="link"
            label={t('looks.profileLink')}
            onPress={() => router.push('/preferences')}
          />
        </View>
      )}
    </View>
  );
}

function Idea({
  kind,
  suggestions,
  icon,
}: {
  kind: 'hairstyle' | 'makeup';
  suggestions: LookSuggestion<Hairstyle | MakeupLook>[];
  icon: IconName;
}) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const suggestion = suggestions[index % suggestions.length];
  if (!suggestion) return null;
  const texts =
    kind === 'hairstyle'
      ? t(`looks.hairstyles.${suggestion.key as Hairstyle}`, {
          returnObjects: true,
        })
      : t(`looks.makeups.${suggestion.key as MakeupLook}`, {
          returnObjects: true,
        });
  const art = lookPhotos[suggestion.key];

  return (
    <View style={styles.idea} testID={`complete-look-${kind}`}>
      <View style={styles.ideaTop}>
        {art ? (
          <Image source={art} style={styles.art} contentFit="contain" />
        ) : (
          <View style={[styles.art, styles.artFallback]}>
            <MaterialCommunityIcons
              name={icon}
              size={32}
              color={colors.primary}
            />
          </View>
        )}
        <View style={styles.flex}>
          <AppText variant="label">{t(`looks.${kind}`)}</AppText>
          <AppText style={styles.name}>{texts.name}</AppText>
        </View>
      </View>
      {suggestion.reasons.length > 0 && (
        // Reasons on one line, scrolling sideways like every tag group.
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reasons}
        >
          {suggestion.reasons.map((reason) => (
            <View key={reason} style={styles.reason}>
              <AppText style={styles.reasonText}>
                {t(`looks.reasons.${reason}`)}
              </AppText>
            </View>
          ))}
        </ScrollView>
      )}
      <AppText>
        <AppText style={styles.howTo}>{`${t('looks.howTo')} : `}</AppText>
        {texts.how}
      </AppText>
      {suggestions.length > 1 && (
        <Button
          variant="link"
          icon="shuffle"
          label={t('looks.another')}
          accessibilityHint={t(`looks.${kind}`)}
          onPress={() => setIndex((current) => current + 1)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: { gap: spacing.xs },
  flex: { flex: 1, gap: spacing.xs },
  teaser: { flexDirection: 'row', gap: spacing.md },
  lock: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  error: { gap: spacing.xs, alignItems: 'flex-start' },
  idea: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: 'flex-start',
  },
  ideaTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  art: { width: ART_SIZE, height: ART_SIZE, borderRadius: radii.card },
  artFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  name: { fontFamily: fonts.serif, fontSize: 20, color: colors.title },
  reasons: { gap: spacing.sm },
  reason: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  reasonText: { fontSize: 13, color: colors.title },
  howTo: { color: colors.title },
  hint: { gap: spacing.xs, alignItems: 'flex-start' },
});
