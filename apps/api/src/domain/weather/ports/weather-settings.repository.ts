import type { WeatherSettings } from '@klotho/shared';

export interface WeatherSettingsRepository {
  /** null when the user never saved any. */
  findByUser(userId: string): Promise<WeatherSettings | null>;
  save(userId: string, settings: WeatherSettings): Promise<WeatherSettings>;
}

export const WEATHER_SETTINGS_REPOSITORY = Symbol('WeatherSettingsRepository');
