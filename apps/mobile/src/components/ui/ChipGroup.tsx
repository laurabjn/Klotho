import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import type { IconName } from '@/theme/icons';
import { spacing } from '@/theme/tokens';

import { Chip, type ChipTone } from './Chip';

interface Option<T extends string> {
  value: T;
  label: string;
  leading?: ReactNode;
  icon?: IconName;
}

interface BaseProps<T extends string> {
  options: Option<T>[];
  testIDPrefix?: string;
  tone?: ChipTone;
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

/**
 * Set of chips, single or multiple choice, always on one line scrolling
 * sideways (never wrapped on several rows).
 */
export function ChipGroup<T extends string>(
  props: SingleProps<T> | MultipleProps<T>,
) {
  const { options, testIDPrefix } = props;

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

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.line}
      accessibilityRole={props.multiple ? undefined : 'radiogroup'}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          leading={option.leading}
          icon={option.icon}
          tone={props.tone}
          multiple={props.multiple}
          selected={isSelected(option.value)}
          onPress={() => toggle(option.value)}
          testID={testIDPrefix && `${testIDPrefix}-${option.value}`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', gap: spacing.sm },
});
