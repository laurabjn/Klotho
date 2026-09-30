import { zodResolver } from '@hookform/resolvers/zod';
import {
  createWardrobeItemSchema,
  PATTERNS,
  SEASONS,
  STYLES,
  SUBCATEGORIES,
  WARDROBE_CATEGORIES,
  WARDROBE_STATUSES,
  type CreateWardrobeItem,
  type CreateWardrobeItemInput,
  type WardrobeItem,
} from '@klotho/shared';
import type { ReactNode } from 'react';
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldError,
  type FieldPath,
  type UseFormReturn,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { LevelPicker } from '@/components/ui/LevelPicker';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { TextField } from '@/components/ui/TextField';
import {
  categoryIcons,
  seasonIcons,
  statusIcons,
  styleIcons,
} from '@/theme/icons';
import { useFieldError } from '@/features/auth/hooks/useFieldError';
import { colors, spacing } from '@/theme/tokens';

import { subcategoryLabel } from '../labels';
import { TemperatureField } from '../components/TemperatureField';

export type WardrobeForm = UseFormReturn<
  CreateWardrobeItemInput,
  unknown,
  CreateWardrobeItem
>;
type FormControl = Control<
  CreateWardrobeItemInput,
  unknown,
  CreateWardrobeItem
>;

export function useWardrobeItemForm(item?: WardrobeItem): WardrobeForm {
  return useForm<CreateWardrobeItemInput, unknown, CreateWardrobeItem>({
    resolver: zodResolver(createWardrobeItemSchema),
    defaultValues: item
      ? {
          name: item.name,
          category: item.category,
          subcategory: item.subcategory,
          primaryColor: item.primaryColor,
          secondaryColors: item.secondaryColors,
          pattern: item.pattern,
          material: item.material,
          styles: item.styles,
          seasons: item.seasons,
          minTemperature: item.minTemperature,
          maxTemperature: item.maxTemperature,
          warmthLevel: item.warmthLevel,
          formalityLevel: item.formalityLevel,
          brand: item.brand,
          size: item.size,
          status: item.status,
        }
      : { secondaryColors: [], styles: [], seasons: [], status: 'AVAILABLE' },
  });
}

export type SectionKey = 'info' | 'colors' | 'style' | 'season';

/** Fields validated before leaving each step of the add flow. */
export const SECTION_FIELDS: Record<
  SectionKey,
  FieldPath<CreateWardrobeItemInput>[]
> = {
  info: ['name', 'category', 'subcategory', 'brand', 'size', 'material'],
  colors: ['primaryColor', 'secondaryColors', 'pattern'],
  style: ['styles', 'formalityLevel'],
  season: ['seasons', 'minTemperature', 'maxTemperature', 'warmthLevel'],
};

function Field({
  title,
  note,
  error,
  children,
}: {
  title: string;
  note?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <SectionTitle title={title} note={note} />
      {children}
      {error && (
        <AppText
          variant="hint"
          style={styles.error}
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      )}
    </View>
  );
}

function useLabels() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  return {
    t,
    error: (error: FieldError | undefined) => fieldError(error),
    optional: t('wardrobe.form.optional'),
    several: t('wardrobe.form.severalChoices'),
  };
}

function InfoSection({ form }: { form: WardrobeForm }) {
  const { t, error, optional } = useLabels();
  const control: FormControl = form.control;
  const { errors } = form.formState;
  const category = useWatch({ control, name: 'category' });

  return (
    <>
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <Field
            title={t('wardrobe.form.category')}
            error={error(errors.category)}
          >
            <ChipGroup
              tone="soft"
              testIDPrefix="category"
              options={WARDROBE_CATEGORIES.map((value) => ({
                value,
                label: t(`wardrobe.category.${value}`),
                icon: categoryIcons[value],
              }))}
              value={field.value}
              onChange={(value) => {
                if (value && value !== field.value)
                  form.setValue('subcategory', null);
                field.onChange(value ?? undefined);
              }}
            />
          </Field>
        )}
      />
      {category && (
        <Controller
          control={control}
          name="subcategory"
          render={({ field }) => (
            <Field title={t('wardrobe.form.subcategory')} note={optional}>
              <ChipGroup
                tone="soft"
                allowNone
                options={SUBCATEGORIES[category].map((value) => ({
                  value,
                  label: subcategoryLabel(t, value),
                }))}
                value={field.value}
                onChange={field.onChange}
              />
            </Field>
          )}
        />
      )}
      <TextInputField
        control={control}
        name="name"
        title={t('wardrobe.form.name')}
        placeholder={t('wardrobe.form.namePlaceholder')}
        icon="pricetag-outline"
        note={optional}
        error={error(errors.name)}
      />
      <TextInputField
        control={control}
        name="brand"
        title={t('wardrobe.form.brand')}
        icon="ribbon-outline"
        note={optional}
        error={error(errors.brand)}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextInputField
            control={control}
            name="size"
            title={t('wardrobe.form.size')}
            icon="resize-outline"
            note={optional}
            error={error(errors.size)}
          />
        </View>
      </View>
      <TextInputField
        control={control}
        name="material"
        title={t('wardrobe.form.material')}
        placeholder={t('wardrobe.form.materialPlaceholder')}
        icon="layers-outline"
        note={optional}
        error={error(errors.material)}
      />
    </>
  );
}

function TextInputField({
  control,
  name,
  title,
  placeholder,
  icon,
  note,
  error,
}: {
  control: FormControl;
  name: 'name' | 'brand' | 'size' | 'material';
  title: string;
  placeholder?: string;
  icon:
    'pricetag-outline' | 'ribbon-outline' | 'resize-outline' | 'layers-outline';
  note?: string;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field title={title} note={note}>
          <TextField
            label={placeholder ?? title}
            icon={icon}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={error}
          />
        </Field>
      )}
    />
  );
}

function ColorsSection({ form }: { form: WardrobeForm }) {
  const { t, error, optional, several } = useLabels();
  const control: FormControl = form.control;
  const { errors } = form.formState;

  return (
    <>
      <Controller
        control={control}
        name="primaryColor"
        render={({ field }) => (
          <Field
            title={t('wardrobe.form.primaryColor')}
            error={error(errors.primaryColor)}
          >
            <ColorPicker value={field.value} onChange={field.onChange} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="secondaryColors"
        render={({ field }) => (
          <Field
            title={t('wardrobe.form.secondaryColors')}
            note={`${optional} · ${several}`}
          >
            <ColorPicker
              multiple
              value={field.value ?? []}
              onChange={field.onChange}
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="pattern"
        render={({ field }) => (
          <Field title={t('wardrobe.form.pattern')} note={optional}>
            <ChipGroup
              tone="soft"
              allowNone
              options={PATTERNS.map((value) => ({
                value,
                label: t(`wardrobe.patterns.${value}`),
              }))}
              value={field.value}
              onChange={field.onChange}
            />
          </Field>
        )}
      />
    </>
  );
}

function StyleSection({ form }: { form: WardrobeForm }) {
  const { t, optional, several } = useLabels();
  const control: FormControl = form.control;

  return (
    <>
      <Controller
        control={control}
        name="styles"
        render={({ field }) => (
          <Field
            title={t('wardrobe.form.styles')}
            note={`${optional} · ${several}`}
          >
            <ChipGroup
              tone="soft"
              multiple
              collapsedCount={9}
              options={STYLES.map((value) => ({
                value,
                label: t(`wardrobe.styles.${value}`),
                icon: styleIcons[value],
              }))}
              value={field.value ?? []}
              onChange={field.onChange}
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="formalityLevel"
        render={({ field }) => (
          <LevelPicker
            label={t('wardrobe.form.formality')}
            value={field.value}
            onChange={field.onChange}
            describe={(level) =>
              t(`wardrobe.formality.${level}` as 'wardrobe.formality.1')
            }
          />
        )}
      />
    </>
  );
}

function SeasonSection({ form }: { form: WardrobeForm }) {
  const { t, error, optional, several } = useLabels();
  const control: FormControl = form.control;
  const { errors } = form.formState;

  return (
    <>
      <Controller
        control={control}
        name="seasons"
        render={({ field }) => (
          <Field
            title={t('wardrobe.form.seasons')}
            note={`${optional} · ${several}`}
          >
            <ChipGroup
              tone="soft"
              multiple
              options={SEASONS.map((value) => ({
                value,
                label: t(`wardrobe.seasons.${value}`),
                icon: seasonIcons[value],
              }))}
              value={field.value ?? []}
              onChange={field.onChange}
            />
          </Field>
        )}
      />
      <Field
        title={t('wardrobe.form.temperature')}
        note={optional}
        error={error(errors.minTemperature) ?? error(errors.maxTemperature)}
      >
        <AppText variant="hint">{t('wardrobe.form.temperatureHint')}</AppText>
        <View style={styles.row}>
          <Controller
            control={control}
            name="minTemperature"
            render={({ field }) => (
              <TemperatureField
                label={t('wardrobe.form.minTemperature')}
                value={field.value}
                onChange={field.onChange}
                invalid={errors.minTemperature !== undefined}
              />
            )}
          />
          <Controller
            control={control}
            name="maxTemperature"
            render={({ field }) => (
              <TemperatureField
                label={t('wardrobe.form.maxTemperature')}
                value={field.value}
                onChange={field.onChange}
                invalid={errors.maxTemperature !== undefined}
              />
            )}
          />
        </View>
      </Field>
      <Controller
        control={control}
        name="warmthLevel"
        render={({ field }) => (
          <LevelPicker
            label={t('wardrobe.form.warmth')}
            value={field.value}
            onChange={field.onChange}
            describe={(level) =>
              t(`wardrobe.warmth.${level}` as 'wardrobe.warmth.1')
            }
          />
        )}
      />
    </>
  );
}

export function StatusSection({ form }: { form: WardrobeForm }) {
  const { t } = useLabels();
  return (
    <Controller
      control={form.control}
      name="status"
      render={({ field }) => (
        <Field title={t('wardrobe.form.status')}>
          <ChipGroup
            tone="soft"
            options={WARDROBE_STATUSES.map((value) => ({
              value,
              label: t(`wardrobe.statuses.${value}`),
              icon: statusIcons[value],
            }))}
            value={field.value}
            onChange={(value) => field.onChange(value ?? 'AVAILABLE')}
          />
        </Field>
      )}
    />
  );
}

export const SECTIONS: Record<
  SectionKey,
  (props: { form: WardrobeForm }) => ReactNode
> = {
  info: InfoSection,
  colors: ColorsSection,
  style: StyleSection,
  season: SeasonSection,
};

export const SECTION_ORDER: SectionKey[] = [
  'info',
  'colors',
  'style',
  'season',
];

const styles = StyleSheet.create({
  field: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  error: { color: colors.error },
});
