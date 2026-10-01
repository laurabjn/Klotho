import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { formatDay } from '@/lib/days';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

const SECTIONS = [
  'purpose',
  'account',
  'beta',
  'content',
  'advice',
  'liability',
  'end',
  'law',
] as const;

/** Day of this version of the terms. */
const TERMS_DATE = '2026-10-04';

/** "Conditions générales" (reachable signed out too, from the sign-up). */
export function TermsScreen() {
  const { t, i18n } = useTranslation();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('settings.terms.title')}
          overline={t('settings.terms.overline')}
        />
        <AppText variant="hint">
          {t('settings.terms.updated', {
            date: formatDay(TERMS_DATE, i18n.language, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          })}
        </AppText>
        {SECTIONS.map((key, index) => (
          <View key={key} style={styles.card}>
            <AppText variant="heading" style={styles.heading}>
              {`${index + 1}. ${t(`settings.terms.sections.${key}.title`)}`}
            </AppText>
            <AppText style={styles.body}>
              {t(`settings.terms.sections.${key}.body`)}
            </AppText>
          </View>
        ))}
      </ScrollPage>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  heading: { fontSize: 20, lineHeight: 25 },
  body: { fontFamily: fonts.serifRegular, fontSize: 15, lineHeight: 21 },
});
