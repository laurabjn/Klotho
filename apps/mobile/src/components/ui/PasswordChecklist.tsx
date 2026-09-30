import { Ionicons } from '@expo/vector-icons';
import { PASSWORD_RULES } from '@klotho/shared';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** Live checklist of the shared password rules, ticked as the user types. */
export function PasswordChecklist({ password }: { password: string }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container} accessibilityRole="summary">
      <AppText variant="hint">{t('auth.passwordRules.title')}</AppText>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        const label = t(rule.key as 'errors.password.tooShort');
        return (
          <View
            key={rule.key}
            style={styles.row}
            accessible
            accessibilityLabel={label}
            accessibilityState={{ checked: ok }}
            testID={`password-rule-${rule.key}`}
          >
            <Ionicons
              name={ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={ok ? colors.primary : colors.placeholder}
            />
            <AppText variant="hint" style={ok ? styles.ok : undefined}>
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, paddingHorizontal: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ok: { color: colors.body },
});
