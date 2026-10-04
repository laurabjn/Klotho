import type {
  CreateWardrobeItemInput,
  GarmentSuggestion,
} from '@klotho/shared';
import type { UseFormSetValue } from 'react-hook-form';

/**
 * Fills the add form with what the AI proposes. Fields the AI left empty
 * keep what the user may already have chosen.
 */
export function applySuggestion(
  setValue: UseFormSetValue<CreateWardrobeItemInput>,
  suggestion: GarmentSuggestion,
): void {
  const options = { shouldDirty: true } as const;
  const { secondaryColors, styles, seasons, ...single } = suggestion;
  for (const [name, value] of Object.entries(single) as [
    keyof typeof single,
    GarmentSuggestion[keyof typeof single],
  ][]) {
    if (value !== null) setValue(name, value as never, options);
  }
  if (secondaryColors.length)
    setValue('secondaryColors', secondaryColors, options);
  if (styles.length) setValue('styles', styles, options);
  if (seasons.length) setValue('seasons', seasons, options);
}
