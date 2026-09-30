import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  WARDROBE_STATUSES,
  type WardrobeItem,
  type WardrobeStatus,
} from '@klotho/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { ColorDot } from '@/components/ui/ColorDot';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { errorMessageKey } from '@/lib/api/errors';
import { categoryIcons, statusIcons, type IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import {
  useDeleteWardrobeItem,
  useUpdateWardrobeItem,
  useWardrobeItem,
} from '../hooks/useWardrobe';
import { itemTitle, subcategoryLabel } from '../labels';
import { WardrobePhotoCarousel } from '../photos/WardrobePhotoCarousel';

export function WardrobeItemDetailsScreen() {
  const { t } = useTranslation();
  const { id, photosFailed } = useLocalSearchParams<{
    id: string;
    /** Set by the add flow when some photos could not be uploaded. */
    photosFailed?: string;
  }>();
  const item = useWardrobeItem(id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {item.data ? (
        <Details item={item.data} photosFailed={Number(photosFailed ?? 0)} />
      ) : item.isError ? (
        <View style={styles.content}>
          <ScreenHeader />
          <EmptyState
            icon="alert-circle-outline"
            title={t('wardrobe.detail.notFound')}
            body={t(errorMessageKey(item.error) as 'apiErrors.unknown')}
            actionLabel={t('common.back')}
            onAction={() => router.back()}
          />
        </View>
      ) : (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      )}
    </SafeAreaView>
  );
}

function Details({
  item,
  photosFailed,
}: {
  item: WardrobeItem;
  photosFailed: number;
}) {
  const { t, i18n } = useTranslation();
  const update = useUpdateWardrobeItem(item.id);
  const remove = useDeleteWardrobeItem(item.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // The page scrolls under the system navigation bar (edge-to-edge).
  const { bottom } = useSafeAreaInsets();

  const changeStatus = (status: WardrobeStatus | null) => {
    if (status && status !== item.status) update.mutate({ status });
  };

  const temperature =
    item.minTemperature != null && item.maxTemperature != null
      ? t('wardrobe.detail.temperatureRange', {
          min: item.minTemperature,
          max: item.maxTemperature,
        })
      : item.minTemperature != null
        ? t('wardrobe.detail.temperatureFrom', { min: item.minTemperature })
        : item.maxTemperature != null
          ? t('wardrobe.detail.temperatureUpTo', { max: item.maxTemperature })
          : null;

  const rows: [IconName, string, ReactNode][] = [
    [
      categoryIcons[item.category],
      t('wardrobe.form.category'),
      t(`wardrobe.category.${item.category}`),
    ],
    ...(item.subcategory
      ? [
          [
            'tag-outline',
            t('wardrobe.form.subcategory'),
            subcategoryLabel(t, item.subcategory),
          ] as [IconName, string, string],
        ]
      : []),
    ...(item.pattern
      ? [
          [
            'checkerboard',
            t('wardrobe.form.pattern'),
            t(`wardrobe.patterns.${item.pattern}`),
          ] as [IconName, string, string],
        ]
      : []),
    ...(temperature
      ? [
          ['thermometer', t('wardrobe.form.temperature'), temperature] as [
            IconName,
            string,
            string,
          ],
        ]
      : []),
    ...(item.material
      ? [
          ['flower-outline', t('wardrobe.form.material'), item.material] as [
            IconName,
            string,
            string,
          ],
        ]
      : []),
    ...(item.brand
      ? [
          ['tag-heart-outline', t('wardrobe.form.brand'), item.brand] as [
            IconName,
            string,
            string,
          ],
        ]
      : []),
    ...(item.size
      ? [
          ['ruler', t('wardrobe.form.size'), item.size] as [
            IconName,
            string,
            string,
          ],
        ]
      : []),
  ];

  // The three cards of the mockup: season, warmth, occasion (formality).
  const infoCards: [IconName, string, string][] = [
    ...(item.seasons.length
      ? [
          [
            'leaf',
            t('wardrobe.form.seasons'),
            item.seasons.map((s) => t(`wardrobe.seasons.${s}`)).join('\n'),
          ] as [IconName, string, string],
        ]
      : []),
    ...(item.warmthLevel
      ? [
          [
            'thermometer',
            t('wardrobe.form.warmth'),
            t(`wardrobe.warmth.${item.warmthLevel}` as 'wardrobe.warmth.1'),
          ] as [IconName, string, string],
        ]
      : []),
    ...(item.formalityLevel
      ? [
          [
            'calendar-blank-outline',
            t('wardrobe.form.formality'),
            t(
              `wardrobe.formality.${item.formalityLevel}` as 'wardrobe.formality.1',
            ),
          ] as [IconName, string, string],
        ]
      : []),
  ];

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xxxl + bottom },
        ]}
      >
        <AppHeader />
        <ScreenHeader title={t('wardrobe.detail.title')} />
        <WardrobePhotoCarousel item={item} />
        {photosFailed > 0 && (
          <FormError
            message={t('wardrobe.photos.uploadFailed', { count: photosFailed })}
          />
        )}
        <AppText variant="title">{itemTitle(t, item)}</AppText>

        <View style={styles.colors}>
          {[item.primaryColor, ...item.secondaryColors].map((color) => (
            <View key={color} style={styles.colorChip}>
              <ColorDot color={color} size={16} />
              <AppText style={styles.chipText}>
                {t(`wardrobe.colors.${color}`)}
              </AppText>
            </View>
          ))}
          <View style={styles.colorChip}>
            <MaterialCommunityIcons
              name={categoryIcons[item.category]}
              size={18}
              color={colors.title}
            />
            <AppText style={styles.chipText}>
              {t(`wardrobe.category.${item.category}`)}
            </AppText>
          </View>
        </View>

        {item.styles.length > 0 && (
          <View style={styles.tags}>
            {item.styles.map((style) => (
              <View key={style} style={styles.tag}>
                <AppText variant="hint">
                  {t(`wardrobe.styles.${style}`)}
                </AppText>
              </View>
            ))}
          </View>
        )}

        {infoCards.length > 0 && (
          <View style={styles.infoCards}>
            {infoCards.map(([icon, label, value]) => (
              <View key={label} style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <AppText variant="hint">{label}</AppText>
                <AppText style={styles.infoValue}>{value}</AppText>
              </View>
            ))}
          </View>
        )}

        {/* Wear history comes with Sprint 8: shown once a piece was worn. */}
        {item.wearCount > 0 && (
          <View style={styles.card}>
            <Ionicons name="repeat-outline" size={22} color={colors.primary} />
            <View style={styles.flex}>
              <AppText variant="label">
                {item.wearCount > 0
                  ? t('wardrobe.detail.worn', { count: item.wearCount })
                  : t('wardrobe.detail.neverWorn')}
              </AppText>
              {item.lastWornAt && (
                <AppText variant="hint">
                  {t('wardrobe.detail.lastWorn', {
                    date: new Date(item.lastWornAt).toLocaleDateString(
                      i18n.language,
                    ),
                  })}
                </AppText>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <AppText variant="heading">
            {t('wardrobe.detail.availability')}
          </AppText>
          <AppText variant="hint">
            {t('wardrobe.detail.availabilityHint')}
          </AppText>
          <ChipGroup
            tone="soft"
            testIDPrefix="status"
            options={WARDROBE_STATUSES.map((value) => ({
              value,
              label: t(`wardrobe.statuses.${value}`),
              icon: statusIcons[value],
            }))}
            value={update.variables?.status ?? item.status}
            onChange={changeStatus}
          />
          <FormError
            message={
              update.error
                ? t(errorMessageKey(update.error) as 'apiErrors.unknown')
                : null
            }
          />
        </View>

        <View style={styles.section}>
          <AppText variant="heading">{t('wardrobe.detail.details')}</AppText>
          {rows.map(([icon, label, value]) => (
            <View key={label} style={styles.detailRow}>
              <MaterialCommunityIcons
                name={icon}
                size={20}
                color={colors.title}
              />
              <AppText variant="hint" style={styles.detailLabel}>
                {label}
              </AppText>
              <AppText style={styles.flex}>{value}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <View style={styles.flex}>
            <Button
              variant="secondary"
              icon="create-outline"
              label={t('wardrobe.detail.edit')}
              onPress={() => router.push(`/piece/${item.id}/edit`)}
            />
          </View>
          <View style={styles.flex}>
            <Button
              variant="secondary"
              icon="trash-outline"
              label={t('wardrobe.detail.delete')}
              onPress={() => setConfirmDelete(true)}
            />
          </View>
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={confirmDelete}
        icon="trash-outline"
        title={t('wardrobe.detail.deleteTitle')}
        message={t('wardrobe.detail.deleteBody')}
        confirmLabel={t('wardrobe.detail.delete')}
        cancelLabel={t('common.cancel')}
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              setConfirmDelete(false);
              router.back();
            },
          })
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxxl },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  chipText: { fontFamily: fonts.serif, fontSize: 16, color: colors.title },
  infoCards: { flexDirection: 'row', gap: spacing.sm },
  infoCard: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  infoValue: {
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 20,
    color: colors.title,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: '#E9DCD3',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  section: { gap: spacing.md },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  detailLabel: { width: 110 },
  actions: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
