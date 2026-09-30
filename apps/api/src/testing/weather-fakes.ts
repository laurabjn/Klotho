// In-memory weather adapters, for unit and e2e tests (no network).
import type { City, WeatherSettings } from '@klotho/shared';

import type { CityGeocoder } from '../domain/weather/ports/city-geocoder';
import type { WeatherProvider } from '../domain/weather/ports/weather-provider';
import type { WeatherSettingsRepository } from '../domain/weather/ports/weather-settings.repository';
import { WeatherUnavailableError } from '../domain/weather/errors';
import type {
  Coordinates,
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

export class FakeWeatherProvider implements WeatherProvider {
  readonly calls: Coordinates[] = [];
  weather: Weather = SUNNY;
  failing = false;

  getCurrentWeather(latitude: number, longitude: number): Promise<Weather> {
    this.calls.push({ latitude, longitude });
    if (this.failing) return Promise.reject(new WeatherUnavailableError());
    return Promise.resolve(this.weather);
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
