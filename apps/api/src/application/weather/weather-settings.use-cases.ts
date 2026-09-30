import {
  weatherSettingsSchema,
  type City,
  type CitySearchQuery,
  type WeatherSettings,
} from '@klotho/shared';

import type { CityGeocoder } from '../../domain/weather/ports/city-geocoder';
import type { WeatherSettingsRepository } from '../../domain/weather/ports/weather-settings.repository';

/** Not set up yet: manual temperature only, in °C. */
const DEFAULT_SETTINGS: WeatherSettings = weatherSettingsSchema.parse({});

export class GetWeatherSettingsUseCase {
  constructor(private readonly settings: WeatherSettingsRepository) {}

  async execute(userId: string): Promise<WeatherSettings> {
    return (await this.settings.findByUser(userId)) ?? DEFAULT_SETTINGS;
  }
}

/** PUT semantics: the given settings replace the previous ones. */
export class UpdateWeatherSettingsUseCase {
  constructor(private readonly settings: WeatherSettingsRepository) {}

  execute(userId: string, settings: WeatherSettings): Promise<WeatherSettings> {
    return this.settings.save(userId, settings);
  }
}

export class SearchCitiesUseCase {
  constructor(private readonly geocoder: CityGeocoder) {}

  execute({ q, lang }: CitySearchQuery): Promise<City[]> {
    return this.geocoder.search(q, lang);
  }
}
