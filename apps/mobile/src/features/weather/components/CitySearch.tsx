import { Ionicons } from '@expo/vector-icons';
import { CITY_QUERY_MIN_LENGTH, type City } from '@klotho/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { errorMessageKey } from '@/lib/api/errors';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { colors, radii, spacing, touchTarget } from '@/theme/tokens';

import { weatherApi } from '../api/weather.api';

export const cityLabel = (city: City) =>
  [city.name, city.region, city.country].filter(Boolean).join(', ');

interface CitySearchProps {
  value: City | null;
  onChange: (city: City) => void;
}

/** Shows the chosen city, or a search field with the matching cities. */
export function CitySearch({ value, onChange }: CitySearchProps) {
  const { t, i18n } = useTranslation();
  const [editing, setEditing] = useState(value === null);
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query.trim());
  const lang = i18n.language === 'en' ? 'en' : 'fr';

  const cities = useQuery({
    queryKey: ['weather', 'cities', search, lang],
    queryFn: () => weatherApi.cities(search, lang),
    enabled: editing && search.length >= CITY_QUERY_MIN_LENGTH,
    staleTime: Infinity,
  });

  if (value && !editing) {
    return (
      <View style={styles.chosen}>
        <Ionicons name="location-outline" size={18} color={colors.primary} />
        <AppText style={styles.grow}>
          {t('weather.location.selectedCity', { city: cityLabel(value) })}
        </AppText>
        <Button
          variant="link"
          label={t('weather.location.changeCity')}
          onPress={() => setEditing(true)}
        />
      </View>
    );
  }

  const choose = (city: City) => {
    onChange(city);
    setEditing(false);
    setQuery('');
  };

  return (
    <View style={styles.search}>
      <TextField
        label={t('weather.location.searchCity')}
        icon="search-outline"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        returnKeyType="search"
      />
      {cities.isFetching && (
        <AppText variant="hint">{t('weather.location.searching')}</AppText>
      )}
      {cities.isError && (
        <AppText variant="hint" style={styles.error}>
          {t(errorMessageKey(cities.error) as 'apiErrors.unknown')}
        </AppText>
      )}
      {cities.data?.length === 0 && (
        <AppText variant="hint">{t('weather.location.noCity')}</AppText>
      )}
      {cities.data?.map((city) => (
        <Pressable
          key={`${city.latitude},${city.longitude}`}
          accessibilityRole="button"
          accessibilityLabel={cityLabel(city)}
          onPress={() => choose(city)}
          style={({ pressed }) => [styles.result, pressed && styles.pressed]}
        >
          <Ionicons name="location-outline" size={18} color={colors.muted} />
          <AppText style={styles.grow}>{cityLabel(city)}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { gap: spacing.sm },
  chosen: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
  error: { color: colors.error },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radii.input,
    backgroundColor: colors.input,
  },
  pressed: { opacity: 0.7 },
});
