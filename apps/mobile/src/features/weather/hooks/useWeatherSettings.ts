import {
  weatherSettingsSchema,
  type WeatherSettings,
  type WeatherSettingsInput,
} from '@klotho/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { weatherApi } from '../api/weather.api';

export const weatherSettingsKey = ['weather', 'settings'] as const;
export const currentWeatherKey = ['weather', 'current'] as const;
export const devicePositionKey = ['weather', 'position'] as const;

/** Not set up: manual temperature only, in °C. */
export const DEFAULT_WEATHER_SETTINGS: WeatherSettings =
  weatherSettingsSchema.parse({});

export function useWeatherSettings() {
  return useQuery({
    queryKey: weatherSettingsKey,
    queryFn: weatherApi.settings,
  });
}

export function useSaveWeatherSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: WeatherSettingsInput) =>
      weatherApi.saveSettings(settings),
    onSuccess: async (settings) => {
      queryClient.setQueryData(weatherSettingsKey, settings);
      // The permission may just have been granted: read the position again.
      await queryClient.invalidateQueries({ queryKey: devicePositionKey });
      await queryClient.invalidateQueries({ queryKey: currentWeatherKey });
    },
  });
}
