import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

/** Short gold underline used under titles in the mockups. */
export function GoldRule({ centered = false }: { centered?: boolean }) {
  return <View style={[styles.rule, centered && styles.centered]} />;
}

const styles = StyleSheet.create({
  rule: {
    width: 36,
    height: 1.5,
    backgroundColor: colors.gold,
    borderRadius: 1,
  },
  centered: { alignSelf: 'center' },
});
