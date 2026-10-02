// In-memory weather adapters, for unit and e2e tests (no network).
import type { City, WeatherSettings } from '@klotho/shared';

import type { CityGeocoder } from '../domain/weather/ports/city-geocoder';
import type { WeatherProvider } from '../domain/weather/ports/weather-provider';
import type { WeatherSettingsRepository } from '../domain/weather/ports/weather-settings.repository';
import { WeatherUnavailableError } from '../domain/weather/errors';
import type {
  Coordinates,
  DailyForecast,
  Weather,
} from '../domain/weather/value-objects/weather';

export const SUNNY: Weather = {
  temperature: 18.4,
  feelsLike: 17.2,
  condition: 'clear',
  precipitation: 0,
  windSpeed: 11.2,
  locationName: 'Lyon',
  observedAt: new Date('2026-10-01T08:00:00.000Z'),
};

/** 5 days from the FixedClock's day (2026-10-01). */
export const FORECAST: DailyForecast[] = [
  { day: '2026-10-01', temperature: 19, condition: 'clear' },
  { day: '2026-10-02', temperature: 14, condition: 'rain' },
  { day: '2026-10-03', temperature: 16, condition: 'cloudy' },
  { day: '2026-10-04', temperature: 21, condition: 'clear' },
  { day: '2026-10-05', temperature: 12, condition: 'rain' },
];

export class FakeWeatherProvider implements WeatherProvider {
  readonly calls: Coordinates[] = [];
  readonly forecastCalls: Coordinates[] = [];
  weather: Weather = SUNNY;
  forecast: DailyForecast[] = FORECAST;
  failing = false;

  getCurrentWeather(latitude: number, longitude: number): Promise<Weather> {
    this.calls.push({ latitude, longitude });
    if (this.failing) return Promise.reject(new WeatherUnavailableError());
    return Promise.resolve(this.weather);
  }

  getDailyForecast(
    latitude: number,
    longitude: number,
  ): Promise<DailyForecast[]> {
    this.forecastCalls.push({ latitude, longitude });
    if (this.failing) return Promise.reject(new WeatherUnavailableError());
    return Promise.resolve(this.forecast);
  }
}

export const LYON: City = {
  name: 'Lyon',
  country: 'FR',
  region: 'Auvergne-Rhône-Alpes',
  latitude: 45.76,
  longitude: 4.84,
};

export class FakeCityGeocoder implements CityGeocoder {
  cities: City[] = [LYON];

  search(query: string): Promise<City[]> {
    const needle = query.toLowerCase();
    return Promise.resolve(
      this.cities.filter((city) => city.name.toLowerCase().startsWith(needle)),
    );
  }
}

export class InMemoryWeatherSettingsRepository implements WeatherSettingsRepository {
  readonly settings = new Map<string, WeatherSettings>();

  findByUser(userId: string): Promise<WeatherSettings | null> {
    return Promise.resolve(this.settings.get(userId) ?? null);
  }

  save(userId: string, settings: WeatherSettings): Promise<WeatherSettings> {
    this.settings.set(userId, settings);
    return Promise.resolve(settings);
  }
}
