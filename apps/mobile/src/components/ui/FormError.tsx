import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** Error returned by the server for the whole form (wrong credentials, network…). */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View
      style={styles.box}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
      <AppText variant="hint" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.input,
    backgroundColor: '#F7E4E0',
  },
  text: { flex: 1, color: colors.error, fontSize: 13 },
});
