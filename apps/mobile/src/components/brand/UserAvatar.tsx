import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { colors, fonts, radii } from '@/theme/tokens';

/** Round profile photo, or the first-name initial until a photo is added. */
export function UserAvatar({ size = 48 }: { size?: number }) {
  const user = useAuthStore((state) => state.user);
  const frame = { width: size, height: size, borderRadius: radii.pill };

  if (user?.avatarUrl) {
    return (
      <Image
        source={{ uri: user.avatarUrl }}
        style={[styles.frame, frame]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View
      style={[styles.frame, styles.placeholder, frame]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <AppText
        style={[
          styles.initial,
          { fontSize: size * 0.45, lineHeight: size * 0.62 },
        ]}
      >
        {user?.firstName.charAt(0).toUpperCase() ?? ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: 2, borderColor: colors.surface },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  initial: { fontFamily: fonts.serif, color: colors.primary },
});
