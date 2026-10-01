import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  WARDROBE_STATUSES,
  type WardrobeItem,
  type WardrobeStatus,
} from '@klotho/shared';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import type { TFunction } from 'i18next';
import { useState, type ReactNode } from 'react';
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
import { ColorDot } from '@/components/ui/ColorDot';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import { OutfitItemTile } from '@/features/outfits/components/OutfitItemTile';
import { useGenerationDraftStore } from '@/features/outfits/store/generation-draft.store';
import { errorMessageKey } from '@/lib/api/errors';
import { categoryIcons, statusIcons, type IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';
import { useCompactLayout } from '@/theme/useCompactLayout';

import { wardrobeApi } from '../api/wardrobe.api';

import {
  useDeleteWardrobeItem,
  useUpdateWardrobeItem,
  useWardrobeItem,
  wardrobeKeys,
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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
  const [soon, setSoon] = useState(false);
  const compact = useCompactLayout();
  const { width } = useWindowDimensions();
  // The photo beside the details, as on the mockup (stacked when narrow).
  const photoWidth = Math.round((width - 2 * spacing.xl - spacing.lg) * 0.5);
  const setMandatoryItem = useGenerationDraftStore((s) => s.setMandatoryItem);

  const createOutfit = () => {
    setMandatoryItem(item);
    router.navigate('/inspirations');
  };

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
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('wardrobe.detail.title')}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('wardrobe.detail.favorite')}
              onPress={() => setSoon(true)}
              style={styles.round}
            >
              <Ionicons name="heart-outline" size={22} color={colors.primary} />
            </Pressable>
          }
        />
        {compact ? (
          <>
            <WardrobePhotoCarousel item={item} />
            <Summary item={item} bleed />
          </>
        ) : (
          <View style={styles.top}>
            <WardrobePhotoCarousel item={item} width={photoWidth} />
            <View style={styles.flex}>
              <Summary item={item} />
            </View>
          </View>
        )}
        {photosFailed > 0 && (
          <FormError
            message={t('wardrobe.photos.uploadFailed', { count: photosFailed })}
          />
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

        <Wear item={item} />

        <Matches item={item} />

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
      </ScrollPage>
      <View style={styles.footer}>
        <Button
          label={t('wardrobe.detail.createOutfit')}
          onPress={createOutfit}
        />
      </View>
      <ConfirmDialog
        visible={soon}
        icon="sparkles-outline"
        title={t('outfits.soon.title')}
        message={t('outfits.soon.body')}
        confirmLabel={t('outfits.soon.ok')}
        onConfirm={() => setSoon(false)}
        onCancel={() => setSoon(false)}
      />
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

/** Name, colours and category, a short description and the styles. */
function Summary({
  item,
  bleed = false,
}: {
  item: WardrobeItem;
  bleed?: boolean;
}) {
  const { t } = useTranslation();
  const summary = describe(t, item);
  const line = bleed ? styles.bleed : undefined;
  const lineContent = bleed ? styles.lineBleed : styles.line;
  return (
    <View style={styles.summary}>
      <AppText variant="title" style={styles.name}>
        {itemTitle(t, item)}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={line}
        contentContainerStyle={lineContent}
      >
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
      </ScrollView>
      {summary && <AppText style={styles.description}>{summary}</AppText>}
      {item.styles.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={line}
          contentContainerStyle={lineContent}
        >
          {item.styles.map((style) => (
            <View key={style} style={styles.tag}>
              <AppText variant="hint">{t(`wardrobe.styles.${style}`)}</AppText>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={styles.rule} />
    </View>
  );
}

/** "Une pièce romantique et chic, à porter au printemps et en automne." */
function describe(t: TFunction, item: WardrobeItem): string | null {
  const and = t('wardrobe.detail.summary.and');
  const styleNames = item.styles
    .slice(0, 2)
    .map((style) => t(`wardrobe.styles.${style}`).toLowerCase())
    .join(and);
  const seasons = item.seasons
    .map((season) => t(`wardrobe.detail.inSeason.${season}`))
    .join(and);
  if (styleNames && seasons)
    return t('wardrobe.detail.summary.stylesSeasons', {
      styles: styleNames,
      seasons,
    });
  if (styleNames)
    return t('wardrobe.detail.summary.styles', { styles: styleNames });
  if (seasons) return t('wardrobe.detail.summary.seasons', { seasons });
  return null;
}

const DAY = 24 * 60 * 60 * 1000;

/** "Il y a 3 semaines". */
function ago(t: TFunction, date: Date): string {
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / DAY));
  if (days === 0) return t('wardrobe.detail.ago.today');
  if (days < 7) return t('wardrobe.detail.ago.days', { count: days });
  if (days < 30)
    return t('wardrobe.detail.ago.weeks', { count: Math.floor(days / 7) });
  if (days < 365)
    return t('wardrobe.detail.ago.months', { count: Math.floor(days / 30) });
  return t('wardrobe.detail.ago.years', { count: Math.floor(days / 365) });
}

/** "Portée 8 fois" and "Dernière fois il y a 3 semaines". */
function Wear({ item }: { item: WardrobeItem }) {
  const { t, i18n } = useTranslation();
  const last = item.lastWornAt ? new Date(item.lastWornAt) : null;
  return (
    <View style={styles.wear}>
      <View style={styles.wearHalf}>
        <View style={styles.infoIcon}>
          <MaterialCommunityIcons
            name="hanger"
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.flex}>
          <AppText variant="hint">{t('wardrobe.detail.wornTitle')}</AppText>
          <AppText style={styles.wearValue}>
            {t('wardrobe.detail.wornTimes', { count: item.wearCount })}
          </AppText>
          <AppText variant="hint">
            {item.wearCount >= 5
              ? t('wardrobe.detail.wornLove')
              : item.wearCount > 0
                ? t('wardrobe.detail.wornSome')
                : t('wardrobe.detail.wornNone')}
          </AppText>
        </View>
      </View>
      <View style={styles.wearDivider} />
      <View style={styles.wearHalf}>
        <View style={styles.infoIcon}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="hint">{t('wardrobe.detail.lastTitle')}</AppText>
          <AppText style={styles.wearValue}>
            {last ? ago(t, last) : t('wardrobe.detail.lastNever')}
          </AppText>
          {last && (
            <AppText variant="hint">
              {t('wardrobe.detail.lastOn', {
                date: last.toLocaleDateString(i18n.language),
              })}
            </AppText>
          )}
        </View>
      </View>
    </View>
  );
}

/** How many pieces "S'accorde avec" shows, and their width. */
const MATCHES = 10;
const MATCH_WIDTH = 104;

/**
 * "S'accorde avec": available pieces of other categories sharing a style
 * with this one.
 */
function Matches({ item }: { item: WardrobeItem }) {
  const { t } = useTranslation();
  const matches = useQuery({
    queryKey: [...wardrobeKeys.all, 'matches', item.id, item.styles],
    queryFn: async () =>
      (
        await wardrobeApi.list({
          style: item.styles.length ? item.styles : undefined,
          status: ['AVAILABLE'],
          pageSize: MATCHES * 2,
        })
      ).items
        .filter(
          (other) =>
            other.id !== item.id &&
            other.category !== item.category &&
            other.category !== 'UNDERWEAR',
        )
        .slice(0, MATCHES),
  });
  if (!matches.data?.length) return null;
  return (
    <View style={styles.section}>
      <AppText variant="heading">{t('wardrobe.detail.matches')}</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.lineBleed}
      >
        {matches.data.map((other) => (
          <OutfitItemTile
            key={other.id}
            item={other}
            width={MATCH_WIDTH}
            onPress={() => router.push(`/piece/${other.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxxl },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  round: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  summary: { gap: spacing.md },
  name: { fontSize: 28, lineHeight: 32 },
  description: { fontSize: 15, lineHeight: 21 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  // Tags on one line scrolling sideways (from edge to edge when stacked).
  bleed: { marginHorizontal: -spacing.xl },
  lineBleed: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  line: { gap: spacing.sm },
  wear: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  wearHalf: { flex: 1, flexDirection: 'row', gap: spacing.sm },
  wearDivider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.border,
  },
  wearValue: {
    fontFamily: fonts.serif,
    fontSize: 18,
    lineHeight: 22,
    color: colors.title,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  chipText: { fontFamily: fonts.serif, fontSize: 15, color: colors.title },
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
    fontSize: 15,
    lineHeight: 19,
    color: colors.title,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: '#E9DCD3',
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
