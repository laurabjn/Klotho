import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

export function HomeScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('home.title')}
      </Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6E3441',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});
