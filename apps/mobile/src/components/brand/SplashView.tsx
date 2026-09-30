import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

// Same image, size and background as the native splash (app.json,
// expo-splash-screen plugin), so that going from one to the other is invisible.
const SPLASH_IMAGE = require('../../../assets/splash-icon.png') as number;
const SPLASH_IMAGE_WIDTH = 200;

/** Shown while the app still loads data after the native splash is hidden. */
export function SplashView() {
  const { t } = useTranslation();
  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={t('common.loading')}
      accessibilityState={{ busy: true }}
    >
      <Image
        source={SPLASH_IMAGE}
        style={styles.image}
        contentFit="contain"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  image: { width: SPLASH_IMAGE_WIDTH, aspectRatio: 1 },
});
