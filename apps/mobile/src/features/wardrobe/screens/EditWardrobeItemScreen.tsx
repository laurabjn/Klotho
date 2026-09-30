import type { WardrobeItem } from '@klotho/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormError } from '@/components/ui/FormError';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, spacing } from '@/theme/tokens';

import {
  SECTION_ORDER,
  SECTIONS,
  StatusSection,
  useWardrobeItemForm,
} from '../form/WardrobeItemFormSections';
import { useUpdateWardrobeItem, useWardrobeItem } from '../hooks/useWardrobe';

export function EditWardrobeItemScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useWardrobeItem(id);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {item.data ? (
        // Mounted once the item is known, so the form starts with its values.
        <EditForm item={item.data} />
      ) : item.isError ? (
        <View style={styles.padded}>
          <ScreenHeader />
          <EmptyState
            icon="alert-circle-outline"
            title={t('wardrobe.detail.notFound')}
            body={t(errorMessageKey(item.error) as 'apiErrors.unknown')}
          />
        </View>
      ) : (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      )}
    </SafeAreaView>
  );
}

function EditForm({ item }: { item: WardrobeItem }) {
  const { t } = useTranslation();
  const form = useWardrobeItemForm(item);
  const update = useUpdateWardrobeItem(item.id);

  const save = form.handleSubmit((values) =>
    update.mutate(values, { onSuccess: () => router.back() }),
  );

  return (
    <>
      <View style={[styles.padded, styles.top]}>
        <AppHeader />
        <ScreenHeader
          title={t('wardrobe.form.editTitle')}
          overline={t('wardrobe.form.editOverline')}
        />
      </View>
      <FormScrollView contentStyle={styles.form}>
        {SECTION_ORDER.map((key) => {
          const Section = SECTIONS[key];
          return <Section key={key} form={form} />;
        })}
        <StatusSection form={form} />
      </FormScrollView>
      <View style={styles.footer}>
        <FormError
          message={
            update.error
              ? t(errorMessageKey(update.error) as 'apiErrors.unknown')
              : null
          }
        />
        <Button
          label={t('wardrobe.form.save')}
          loading={update.isPending}
          onPress={() => void save()}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  top: { gap: spacing.lg },
  loader: { marginTop: spacing.xxxl },
  form: { gap: spacing.xxl, padding: spacing.xl },
  footer: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
