import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

import { AppText } from './AppText';
import { ScrollToFocusedInputContext } from './useScrollToFocusedInput';

interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholder'> {
  /** Shown as placeholder and used as accessibility label (mockups have no visible label). */
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  /** Red border without a message (e.g. a checklist explains the problem). */
  invalid?: boolean;
  password?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField(
    {
      label,
      icon,
      error,
      invalid = false,
      password = false,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) {
    const { t } = useTranslation();
    const [hidden, setHidden] = useState(password);
    const [focused, setFocused] = useState(false);
    const scrollIntoView = useContext(ScrollToFocusedInputContext);
    const isInvalid = invalid || error !== undefined;

    return (
      <View style={styles.wrapper}>
        <View
          style={[
            styles.field,
            focused && styles.focused,
            isInvalid && styles.invalid,
          ]}
        >
          <Ionicons name={icon} size={20} color={colors.muted} />
          <TextInput
            ref={ref}
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            {...props}
            {...(password && { autoCapitalize: 'none', autoCorrect: false })}
            accessibilityLabel={label}
            accessibilityHint={error}
            placeholder={label}
            secureTextEntry={hidden}
            onFocus={(e) => {
              setFocused(true);
              scrollIntoView?.();
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
          />
          {password && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                hidden ? t('common.showPassword') : t('common.hidePassword')
              }
              hitSlop={12}
              onPress={() => setHidden((value) => !value)}
            >
              <Ionicons
                name={hidden ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.muted}
              />
            </Pressable>
          )}
        </View>
        {error !== undefined && (
          <AppText
            variant="hint"
            accessibilityLiveRegion="polite"
            style={styles.error}
          >
            {error}
          </AppText>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  field: {
    minHeight: touchTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  focused: { borderColor: colors.primary },
  invalid: { borderColor: colors.error },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontFamily: fonts.serifRegular,
    fontSize: 17,
    color: colors.title,
  },
  error: { color: colors.error, marginLeft: spacing.xs },
});
