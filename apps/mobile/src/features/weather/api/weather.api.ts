import type {
  City,
  CurrentWeather,
  WeatherSettings,
  WeatherSettingsInput,
} from '@klotho/shared';

import { request } from '@/lib/api/http';

import type { Coordinates } from '../lib/device-position';

export const weatherApi = {
  /** At the given (rounded) position, or at the saved city without one. */
  current: (position?: Coordinates) =>
    request<CurrentWeather>(
      position
        ? `/weather/current?latitude=${position.latitude}&longitude=${position.longitude}`
        : '/weather/current',
      { auth: true },
    ),
  cities: (query: string, lang: 'fr' | 'en') =>
    request<City[]>(
      `/weather/cities?q=${encodeURIComponent(query)}&lang=${lang}`,
      { auth: true },
    ),
  settings: () => request<WeatherSettings>('/weather/settings', { auth: true }),
  saveSettings: (body: WeatherSettingsInput) =>
    request<WeatherSettings>('/weather/settings', {
      method: 'PUT',
      body,
      auth: true,
    }),
};
