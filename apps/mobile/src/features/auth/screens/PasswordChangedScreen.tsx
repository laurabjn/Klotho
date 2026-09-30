import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KlothoBrandRow } from '@/components/brand/KlothoLogo';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/ui/GoldRule';
import { colors, radii, spacing } from '@/theme/tokens';

export function PasswordChangedScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <KlothoBrandRow />
      <View style={styles.content}>
        <View
          style={styles.badge}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Ionicons name="checkmark" size={56} color={colors.onPrimary} />
        </View>
        <AppText variant="title" center>
          {t('auth.passwordChanged.title')}
        </AppText>
        <GoldRule centered />
        <AppText center>{t('auth.passwordChanged.body')}</AppText>
      </View>
      {/* Every session was revoked by the reset: go back to the sign-in screen. */}
      <Button
        label={t('auth.passwordChanged.login')}
        onPress={() => router.replace('/login')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
});
