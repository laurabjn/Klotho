import { COLORS, type ColorKey } from '@klotho/shared';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

/** Round swatch of a wardrobe colour, with a hairline so light colours stay visible. */
export function ColorDot({
  color,
  size = 14,
}: {
  color: ColorKey;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS[color],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
  },
});
