import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { FormError } from '@/components/ui/FormError';
import { addDays, formatDay, today } from '@/lib/days';

/** How far ahead a look can be planned from the sheet. */
const DAYS_AHEAD = 21;

/**
 * Chooses a day among the next three weeks ("Planifier cette tenue",
 * "Déplacer"): the days on one line, then the button.
 */
export function DayPickerSheet({
  visible,
  title,
  overline,
  confirmLabel,
  initialDay,
  exclude,
  loading = false,
  error,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  overline?: string;
  confirmLabel: string;
  initialDay?: string;
  /** A day that cannot be chosen (the one the look is on). */
  exclude?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: (day: string) => void;
  onClose: () => void;
}) {
  const { i18n } = useTranslation();
  const first = today();
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) =>
    addDays(first, i),
  ).filter((day) => day !== exclude);
  const [day, setDay] = useState<string>(initialDay ?? days[0]!);

  return (
    <BottomSheet
      visible={visible}
      title={title}
      overline={overline}
      onClose={onClose}
      footer={
        <Button
          label={confirmLabel}
          loading={loading}
          onPress={() => onConfirm(day)}
        />
      }
    >
      <ChipGroup
        options={days.map((value) => ({
          value,
          label: formatDay(value, i18n.language, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }),
        }))}
        value={day}
        onChange={(next) => next && setDay(next)}
      />
      <FormError message={error ?? null} />
    </BottomSheet>
  );
}
