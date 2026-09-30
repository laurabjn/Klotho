import {
  BOTTOM_PREFERENCES,
  LENGTHS,
  METALS,
  SEASONS,
  STYLES,
  type BottomPreference,
  type ColorKey,
  type Length,
  type Metal,
  type Season,
  type Style,
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
import { spacing } from '@/theme/tokens';

export interface SectionProps {
  value: StyleProfileFields;
  onChange: (next: StyleProfileFields) => void;
}

function Section({
  title,
  note,
  hint,
  children,
}: {
  title: string;
  note?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle title={title} note={note} />
      {hint && <AppText variant="hint">{hint}</AppText>}
      {children}
    </View>
  );
}

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
      <ChipGroup<Style>
        multiple
        collapsedCount={9}
        testIDPrefix="style"
        options={STYLES.map((style) => ({
          value: style,
          label: t(`wardrobe.styles.${style}`),
        }))}
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
export function ColorsSection({ value, onChange }: SectionProps) {
  const { t } = useTranslation();
  const without = (list: ColorKey[], removed: ColorKey[]) =>
    list.filter((color) => !removed.includes(color));

  return (
    <>
      <Section
        title={t('preferences.colors')}
        hint={t('preferences.colorsHint')}
      >
        <ColorPicker
          multiple
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
      <Section
        title={t('preferences.avoided')}
        note={t('preferences.optional')}
        hint={t('preferences.avoidedHint')}
      >
        <ColorPicker
          multiple
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
        note={t('preferences.severalChoices')}
        hint={t('preferences.metalHint')}
      >
        <ChipGroup<Metal>
          multiple
          testIDPrefix="metal"
          options={METALS.map((metal) => ({
            value: metal,
            label: t(`preferences.metals.${metal}`),
          }))}
          value={value.preferredMetals}
          onChange={(preferredMetals) =>
            onChange({ ...value, preferredMetals })
          }
        />
      </Section>
      <Section title={t('preferences.heels')}>
        <ChipGroup<'yes' | 'no' | 'none'>
          testIDPrefix="heels"
          options={[
            { value: 'yes', label: t('preferences.heelsYes') },
            { value: 'no', label: t('preferences.heelsNo') },
            { value: 'none', label: t('preferences.noPreference') },
          ]}
          value={triState(value.acceptsHeels)}
          onChange={(choice) =>
            onChange({ ...value, acceptsHeels: fromTriState(choice) })
          }
        />
      </Section>
      <Section
        title={t('preferences.bottoms')}
        note={t('preferences.severalChoices')}
      >
        <ChipGroup<BottomPreference>
          multiple
          options={BOTTOM_PREFERENCES.map((bottom) => ({
            value: bottom,
            label: t(`preferences.bottomOptions.${bottom}`),
          }))}
          value={value.preferredBottoms}
          onChange={(preferredBottoms) =>
            onChange({ ...value, preferredBottoms })
          }
        />
      </Section>
      <LevelPicker
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
  section: { gap: spacing.md },
});
