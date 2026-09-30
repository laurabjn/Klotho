import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KlothoBrandRow } from '@/components/brand/KlothoLogo';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/ui/GoldRule';
import { photos } from '@/theme/photos';
import { colors, spacing } from '@/theme/tokens';

const CLEAR = 'rgba(251, 247, 242, 0)';

export function PasswordChangedScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brand}>
          <KlothoBrandRow />
        </View>
        {/* The photo shows the rose-gold check medallion of the mockup. */}
        <View
          style={[styles.photo, { aspectRatio: photos.passwordChanged.ratio }]}
          importantForAccessibility="no-hide-descendants"
        >
          <Image
            source={photos.passwordChanged.source}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={[colors.background, CLEAR, CLEAR, colors.background]}
            locations={[0, 0.2, 0.8, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={styles.content}>
          <AppText variant="title" center>
            {t('auth.passwordChanged.title')}
          </AppText>
          <GoldRule centered />
          <AppText center>{t('auth.passwordChanged.body')}</AppText>
        </View>
        {/* Every session was revoked by the reset: go back to the sign-in screen. */}
        <View style={styles.footer}>
          <Button
            label={t('auth.passwordChanged.login')}
            onPress={() => router.replace('/login')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  brand: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  photo: { width: '100%' },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
});
