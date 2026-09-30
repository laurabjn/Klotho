import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { KlothoBrandRow } from './KlothoLogo';
import { UserAvatar } from './UserAvatar';

/**
 * Top of every in-app screen, as on the mockups: logo on the left, profile
 * photo (or another element, e.g. the onboarding step) on the right.
 */
export function AppHeader({ right }: { right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <KlothoBrandRow />
      {right === undefined ? <ProfileButton /> : right}
    </View>
  );
}

/** The profile photo opens the "Moi" tab, from anywhere in the app. */
function ProfileButton() {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('profile.open')}
      onPress={() => router.navigate('/me')}
      hitSlop={8}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <UserAvatar />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.7 },
});
