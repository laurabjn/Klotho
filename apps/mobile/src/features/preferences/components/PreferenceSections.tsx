import {
  BOTTOM_PREFERENCES,
  LENGTHS,
  SEASONS,
  type BottomPreference,
  type ColorKey,
  type Length,
  type Season,
  type StyleProfileFields,
} from '@klotho/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { LevelPicker } from '@/components/ui/LevelPicker';
import { SectionTitle } from '@/components/ui/SectionTitle';
import type { IconName } from '@/theme/icons';
import { colors, spacing } from '@/theme/tokens';

import { MetalPicker } from './MetalPicker';
import { StyleCards } from './StyleCards';

export interface SectionProps {
  value: StyleProfileFields;
  onChange: (next: StyleProfileFields) => void;
}

function Section({
  title,
  note,
  hint,
  aside,
  children,
}: {
  title: string;
  note?: string;
  hint?: string;
  /** Rose hint on the right of a capitalised title, as on the colour mockups. */
  aside?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle
        title={title}
        note={note}
        variant={aside ? 'overline' : 'label'}
        aside={aside}
      />
      {hint && <AppText variant="hint">{hint}</AppText>}
      {children}
    </View>
  );
}

const BOTTOM_ICONS: Record<BottomPreference, IconName> = {
  skirts: 'human-female-dance',
  dresses: 'human-female',
  trousers: 'human-male-height-variant',
};

/** Tri-state choice (yes / no / no preference) shown as three chips. */
function triState(value: boolean | null): 'yes' | 'no' | 'none' {
  if (value === null) return 'none';
  return value ? 'yes' : 'no';
}
const fromTriState = (choice: 'yes' | 'no' | 'none' | null) =>
  choice === 'yes' ? true : choice === 'no' ? false : null;

export function StylesSection({ value, onChange }: SectionProps) {
  const { t } = useTranslation();
  return (
    <Section
      title={t('preferences.styles')}
      note={t('preferences.severalChoices')}
    >
      <StyleCards
        value={value.preferredStyles}
        onChange={(preferredStyles) => onChange({ ...value, preferredStyles })}
      />
    </Section>
  );
}

/**
 * Favourite and avoided colours. A colour cannot be in both lists: choosing
 * it in one removes it from the other.
 */
export function ColorsSection({
  value,
  onChange,
  large = false,
  row = false,
}: SectionProps & { large?: boolean; row?: boolean }) {
  const { t } = useTranslation();
  const without = (list: ColorKey[], removed: ColorKey[]) =>
    list.filter((color) => !removed.includes(color));

  return (
    <>
      <Section
        title={t('preferences.colors')}
        aside={t('preferences.colorsHint')}
      >
        <ColorPicker
          multiple
          large={large}
          row={row}
          value={value.preferredColors}
          onChange={(preferredColors) =>
            onChange({
              ...value,
              preferredColors,
              avoidedColors: without(value.avoidedColors, preferredColors),
            })
          }
        />
      </Section>
      <View style={styles.divider} />
      <Section
        title={t('preferences.avoided')}
        aside={t('preferences.optional')}
        hint={t('preferences.avoidedHint')}
      >
        <ColorPicker
          multiple
          large={large}
          row={row}
          value={value.avoidedColors}
          onChange={(avoidedColors) =>
            onChange({
              ...value,
              avoidedColors,
              preferredColors: without(value.preferredColors, avoidedColors),
            })
          }
        />
      </Section>
    </>
  );
}

export function PracticalSection({ value, onChange }: SectionProps) {
  const { t } = useTranslation();
  return (
    <>
      <Section
        title={t('preferences.metal')}
        aside={t('preferences.severalChoices')}
        hint={t('preferences.metalHint')}
      >
        <MetalPicker
          value={value.preferredMetals}
          onChange={(preferredMetals) =>
            onChange({ ...value, preferredMetals })
          }
        />
      </Section>
      <Section title={t('preferences.heels')} aside={t('preferences.optional')}>
        <ChipGroup<'yes' | 'no' | 'none'>
          tone="soft"
          testIDPrefix="heels"
          options={[
            {
              value: 'yes',
              label: t('preferences.heelsYes'),
              icon: 'shoe-heel',
            },
            {
              value: 'no',
              label: t('preferences.heelsNo'),
              icon: 'shoe-ballet',
            },
            {
              value: 'none',
              label: t('preferences.noPreference'),
              icon: 'minus-circle-outline',
            },
          ]}
          value={triState(value.acceptsHeels)}
          onChange={(choice) =>
            onChange({ ...value, acceptsHeels: fromTriState(choice) })
          }
        />
      </Section>
      <Section
        title={t('preferences.bottoms')}
        aside={t('preferences.severalChoices')}
      >
        <ChipGroup<BottomPreference>
          multiple
          tone="soft"
          options={BOTTOM_PREFERENCES.map((bottom) => ({
            value: bottom,
            label: t(`preferences.bottomOptions.${bottom}`),
            icon: BOTTOM_ICONS[bottom],
          }))}
          value={value.preferredBottoms}
          onChange={(preferredBottoms) =>
            onChange({ ...value, preferredBottoms })
          }
        />
      </Section>
      <View style={styles.divider} />
      <LevelPicker
        labelVariant="overline"
        label={t('preferences.formality')}
        value={value.preferredFormality}
        onChange={(preferredFormality) =>
          onChange({ ...value, preferredFormality })
        }
        describe={(level) =>
          t(`wardrobe.formality.${level}` as 'wardrobe.formality.1')
        }
      />
    </>
  );
}

/** Only in the preferences screen: colour analysis, length, neckline. */
export function AdvancedSection({ value, onChange }: SectionProps) {
  const { t } = useTranslation();
  return (
    <>
      <Section
        title={t('preferences.face')}
        note={t('preferences.optional')}
        hint={t('preferences.faceHint')}
      >
        <ColorPicker
          multiple
          row
          value={value.facePreferredColors}
          onChange={(facePreferredColors) =>
            onChange({ ...value, facePreferredColors })
          }
        />
      </Section>
      <Section
        title={t('preferences.colorSeason')}
        note={t('preferences.optional')}
        hint={t('preferences.colorSeasonHint')}
      >
        <ChipGroup<Season>
          allowNone
          options={SEASONS.map((season) => ({
            value: season,
            label: t(`wardrobe.seasons.${season}`),
          }))}
          value={value.colorSeason}
          onChange={(colorSeason) => onChange({ ...value, colorSeason })}
        />
      </Section>
      <Section
        title={t('preferences.length')}
        note={t('preferences.optional')}
        hint={t('preferences.lengthHint')}
      >
        <ChipGroup<Length>
          allowNone
          options={LENGTHS.map((length) => ({
            value: length,
            label: t(`preferences.lengths.${length}`),
          }))}
          value={value.minLength}
          onChange={(minLength) => onChange({ ...value, minLength })}
        />
      </Section>
      <Section
        title={t('preferences.neckline')}
        note={t('preferences.optional')}
      >
        <ChipGroup<'yes' | 'no' | 'none'>
          options={[
            { value: 'yes', label: t('preferences.necklineAvoid') },
            { value: 'no', label: t('preferences.necklineAny') },
          ]}
          allowNone
          value={
            value.avoidsDeepNeckline === null
              ? null
              : triState(value.avoidsDeepNeckline)
          }
          onChange={(choice) =>
            onChange({ ...value, avoidsDeepNeckline: fromTriState(choice) })
          }
        />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  section: { gap: spacing.md },
});
