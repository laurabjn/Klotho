import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { contactUs } from './SettingsScreen';

const QUESTIONS = [
  'add',
  'generate',
  'weather',
  'worn',
  'unavailable',
  'data',
] as const;

/** "Centre d'aide": frequent questions, then a way to write to us. */
export function HelpScreen() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(null);
  const [noContact, setNoContact] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('settings.helpCenter.title')}
          overline={t('settings.helpCenter.overline')}
        />
        {QUESTIONS.map((key) => {
          const expanded = open === key;
          return (
            <View key={key} style={styles.card}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(`settings.helpCenter.questions.${key}.q`)}
                accessibilityState={{ expanded }}
                onPress={() => setOpen(expanded ? null : key)}
                style={styles.question}
              >
                <AppText style={styles.questionText}>
                  {t(`settings.helpCenter.questions.${key}.q`)}
                </AppText>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
              {expanded && (
                <AppText style={styles.answer}>
                  {t(`settings.helpCenter.questions.${key}.a`)}
                </AppText>
              )}
            </View>
          );
        })}

        <View style={[styles.card, styles.contact]}>
          <AppText variant="heading" style={styles.contactTitle}>
            {t('settings.helpCenter.contactTitle')}
          </AppText>
          <AppText style={styles.answer}>
            {noContact
              ? t('settings.helpCenter.contactSoon')
              : t('settings.helpCenter.contactBody')}
          </AppText>
          <Button
            variant="secondary"
            icon="mail-outline"
            label={t('settings.helpCenter.contactAction')}
            onPress={() => {
              if (!contactUs()) setNoContact(true);
            }}
          />
        </View>
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
  question: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  questionText: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 22,
    color: colors.title,
  },
  answer: { fontSize: 15, lineHeight: 21 },
  contact: { marginTop: spacing.md },
  contactTitle: { fontSize: 22, lineHeight: 27 },
});
