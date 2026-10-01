import type { StyleProfile, StyleProfileFields } from '@klotho/shared';
import { router } from 'expo-router';
import { useState } from 'react';
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

import {
  AdvancedSection,
  ColorsSection,
  PracticalSection,
  StylesSection,
} from '../components/PreferenceSections';
import {
  toFields,
  useSaveStyleProfile,
  useStyleProfile,
} from '../hooks/useStyleProfile';

/** Moi → Mes préférences: every preference, including the advanced ones. */
export function PreferencesScreen() {
  const { t } = useTranslation();
  const profile = useStyleProfile();

  return (
    <SafeAreaView style={styles.safe}>
      {profile.data ? (
        // Mounted once loaded, so the draft starts from the saved profile.
        <Editor profile={profile.data} />
      ) : profile.isError ? (
        <View style={styles.content}>
          <ScreenHeader title={t('preferences.title')} />
          <EmptyState
            icon="cloud-offline-outline"
            title={t('preferences.loadError')}
            body={t(errorMessageKey(profile.error) as 'apiErrors.unknown')}
            actionLabel={t('common.retry')}
            onAction={() => void profile.refetch()}
          />
        </View>
      ) : (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      )}
    </SafeAreaView>
  );
}

function Editor({ profile }: { profile: StyleProfile }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<StyleProfileFields>(() =>
    toFields(profile),
  );
  const save = useSaveStyleProfile();
  const props = { value: draft, onChange: setDraft };

  return (
    <>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('preferences.title')}
          overline={t('preferences.overline')}
        />
        <StylesSection {...props} />
        <ColorsSection {...props} row />
        <PracticalSection {...props} />
        <AdvancedSection {...props} />
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
          label={t('preferences.save')}
          decorated={false}
          loading={save.isPending}
          onPress={() => save.mutate(draft, { onSuccess: () => router.back() })}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxxl },
  content: { gap: spacing.xxl, padding: spacing.xl },
  footer: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
