import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, spacing } from '@/theme/tokens';

import logoXml from './logo-xml';
import monogramXml from './monogram-xml';

/** Monogram + wordmark stacked (splash-like). The SVG is 780 x 820. */
export function KlothoLogo({ width = 160 }: { width?: number }) {
  const { t } = useTranslation();
  return (
    <SvgXml
      xml={logoXml}
      width={width}
      height={(width * 820) / 780}
      accessibilityRole="image"
      accessibilityLabel={t('common.appName')}
    />
  );
}

/** Small monogram + "Klotho" wordmark in a row, as in the mockups' headers. */
export function KlothoBrandRow({ centered = false }: { centered?: boolean }) {
  return (
    <View
      style={[styles.row, centered && styles.centered]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Klotho"
    >
      <SvgXml xml={monogramXml} width={56} height={56} />
      <AppText style={styles.wordmark}>Klotho</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  centered: { alignSelf: 'center' },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: 44,
    lineHeight: 56,
    color: colors.title,
  },
});
