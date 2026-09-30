import type {
  CurrentWeather,
  CurrentWeatherQuery,
  LocationMode,
} from '@klotho/shared';

import { WeatherLocationMissingError } from '../../domain/weather/errors';
import type { WeatherProvider } from '../../domain/weather/ports/weather-provider';
import type { WeatherSettingsRepository } from '../../domain/weather/ports/weather-settings.repository';
import {
  coarsen,
  type Coordinates,
  type Weather,
} from '../../domain/weather/value-objects/weather';

/**
 * Weather at the phone position when the app sends it (never stored), else
 * at the city saved in the settings.
 */
export class GetCurrentWeatherUseCase {
  constructor(
    private readonly provider: WeatherProvider,
    private readonly settings: WeatherSettingsRepository,
  ) {}

  async execute(
    userId: string,
    query: CurrentWeatherQuery,
  ): Promise<CurrentWeather> {
    if (query.latitude !== undefined && query.longitude !== undefined) {
      const weather = await this.fetch(
        coarsen({ latitude: query.latitude, longitude: query.longitude }),
      );
      return toDto(weather, 'device');
    }

    const city = (await this.settings.findByUser(userId))?.city;
    if (!city) throw new WeatherLocationMissingError();
    const weather = await this.fetch(city);
    // The name the user picked, rather than the provider's station name.
    return toDto({ ...weather, locationName: city.name }, 'city');
  }

  private fetch({ latitude, longitude }: Coordinates): Promise<Weather> {
    return this.provider.getCurrentWeather(latitude, longitude);
  }
}

function toDto(weather: Weather, source: LocationMode): CurrentWeather {
  return {
    ...weather,
    observedAt: weather.observedAt.toISOString(),
    source,
  };
}
