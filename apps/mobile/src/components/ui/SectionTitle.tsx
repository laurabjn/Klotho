import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** Field or section label, with an optional lighter note ("(optionnel)"). */
export function SectionTitle({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="label" accessibilityRole="header">
        {title}
      </AppText>
      {note && <AppText variant="hint">{note}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
