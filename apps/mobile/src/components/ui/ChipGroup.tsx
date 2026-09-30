import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { Button } from './Button';
import { Chip } from './Chip';

interface Option<T extends string> {
  value: T;
  label: string;
  leading?: ReactNode;
}

interface BaseProps<T extends string> {
  options: Option<T>[];
  /** Shows only the first N options until "Voir tout" is pressed. */
  collapsedCount?: number;
  testIDPrefix?: string;
}

interface SingleProps<T extends string> extends BaseProps<T> {
  multiple?: false;
  value: T | null | undefined;
  onChange: (value: T | null) => void;
  /** Allows unselecting the current value by pressing it again. */
  allowNone?: boolean;
}

interface MultipleProps<T extends string> extends BaseProps<T> {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
}

/** Wrapping set of chips, single or multiple choice. */
export function ChipGroup<T extends string>(
  props: SingleProps<T> | MultipleProps<T>,
) {
  const { t } = useTranslation();
  const { options, collapsedCount, testIDPrefix } = props;
  const [expanded, setExpanded] = useState(false);

  const isSelected = (value: T) =>
    props.multiple ? props.value.includes(value) : props.value === value;

  const toggle = (value: T) => {
    if (props.multiple) {
      props.onChange(
        props.value.includes(value)
          ? props.value.filter((v) => v !== value)
          : [...props.value, value],
      );
    } else {
      props.onChange(props.value === value && props.allowNone ? null : value);
    }
  };

  // Selected options stay visible even when the list is collapsed.
  const collapsible =
    collapsedCount !== undefined && options.length > collapsedCount;
  const visible =
    collapsible && !expanded
      ? options.filter(
          (option, index) => index < collapsedCount || isSelected(option.value),
        )
      : options;

  return (
    <View>
      <View
        style={styles.wrap}
        accessibilityRole={props.multiple ? undefined : 'radiogroup'}
      >
        {visible.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            leading={option.leading}
            multiple={props.multiple}
            selected={isSelected(option.value)}
            onPress={() => toggle(option.value)}
            testID={testIDPrefix && `${testIDPrefix}-${option.value}`}
          />
        ))}
      </View>
      {collapsible && (
        <View style={styles.more}>
          <Button
            variant="link"
            label={
              expanded ? t('wardrobe.form.seeLess') : t('wardrobe.form.seeAll')
            }
            onPress={() => setExpanded((value) => !value)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  more: { alignItems: 'flex-start' },
});
