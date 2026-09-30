import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

interface SectionTitleProps {
  title: string;
  /** Lighter note right after the title ("(optionnel)"). */
  note?: string;
  /** "label": serif field label. "overline": spaced capitals ("VOS COULEURS FAVORITES"). */
  variant?: 'label' | 'overline' | 'heading';
  /** Rose text on the right: a hint, or a link when `onAside` is given ("Voir tout ›"). */
  aside?: string;
  onAside?: () => void;
}

/** Field or section title, as on the mockups. */
export function SectionTitle({
  title,
  note,
  variant = 'label',
  aside,
  onAside,
}: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.title}>
        <AppText variant={variant} accessibilityRole="header">
          {title}
        </AppText>
        {note && <AppText variant="hint">{note}</AppText>}
      </View>
      {aside &&
        (onAside ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={aside}
            onPress={onAside}
            hitSlop={8}
            style={styles.aside}
          >
            <AppText style={styles.asideText} numberOfLines={1}>
              {aside}
            </AppText>
            <Ionicons name="chevron-forward" size={14} color={colors.link} />
          </Pressable>
        ) : (
          <AppText style={[styles.asideText, styles.asideHint]}>
            {aside}
          </AppText>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  aside: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  asideText: { fontSize: 14, lineHeight: 18, color: colors.link },
  asideHint: { flexShrink: 1, textAlign: 'right' },
});
