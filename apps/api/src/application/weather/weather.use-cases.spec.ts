import { weatherSettingsSchema } from '@klotho/shared';

import {
  WeatherLocationMissingError,
  WeatherUnavailableError,
} from '../../domain/weather/errors';
import {
  FakeCityGeocoder,
  FakeWeatherProvider,
  InMemoryWeatherSettingsRepository,
  LYON,
} from '../../testing/weather-fakes';
import { GetCurrentWeatherUseCase } from './get-current-weather.use-case';
import {
  GetWeatherSettingsUseCase,
  SearchCitiesUseCase,
  UpdateWeatherSettingsUseCase,
} from './weather-settings.use-cases';

describe('Weather use cases', () => {
  let provider: FakeWeatherProvider;
  let settings: InMemoryWeatherSettingsRepository;
  let current: GetCurrentWeatherUseCase;

  const saveCity = () =>
    settings.save(
      'user-1',
      weatherSettingsSchema.parse({ locationMode: 'city', city: LYON }),
    );

  beforeEach(() => {
    provider = new FakeWeatherProvider();
    settings = new InMemoryWeatherSettingsRepository();
    current = new GetCurrentWeatherUseCase(provider, settings);
  });

  describe('GetCurrentWeatherUseCase', () => {
    it('uses the phone position, rounded to about 1 km', async () => {
      const weather = await current.execute('user-1', {
        latitude: 45.764043,
        longitude: 4.835659,
      });

      expect(provider.calls).toEqual([{ latitude: 45.76, longitude: 4.84 }]);
      expect(weather).toEqual({
        temperature: 18.4,
        feelsLike: 17.2,
        condition: 'clear',
        precipitation: 0,
        windSpeed: 11.2,
        locationName: 'Lyon',
        observedAt: '2026-10-01T08:00:00.000Z',
        source: 'device',
      });
    });

    it('never stores the position', async () => {
      await current.execute('user-1', { latitude: 45.76, longitude: 4.84 });

      expect(settings.settings.size).toBe(0);
    });

    it('falls back to the saved city, named as the user chose it', async () => {
      await saveCity();
      provider.weather = {
        ...provider.weather,
        locationName: 'Arrondissement de Lyon',
      };

      const weather = await current.execute('user-1', {});

      expect(provider.calls).toEqual([{ latitude: 45.76, longitude: 4.84 }]);
      expect(weather).toMatchObject({ locationName: 'Lyon', source: 'city' });
    });

    it('needs a position or a saved city', async () => {
      await expect(current.execute('user-1', {})).rejects.toBeInstanceOf(
        WeatherLocationMissingError,
      );
      expect(provider.calls).toHaveLength(0);
    });

    it('lets the provider failure through (handled by the app)', async () => {
      provider.failing = true;

      await expect(
        current.execute('user-1', { latitude: 45.76, longitude: 4.84 }),
      ).rejects.toBeInstanceOf(WeatherUnavailableError);
    });
  });

  describe('weather settings', () => {
    it('are not set up, in °C, for a new user', async () => {
      await expect(
        new GetWeatherSettingsUseCase(settings).execute('user-1'),
      ).resolves.toEqual({
        locationMode: null,
        city: null,
        temperatureUnit: 'celsius',
      });
    });

    it('are saved per user', async () => {
      const update = new UpdateWeatherSettingsUseCase(settings);
      const saved = weatherSettingsSchema.parse({
        locationMode: 'device',
        temperatureUnit: 'fahrenheit',
      });

      await expect(update.execute('user-1', saved)).resolves.toEqual(saved);
      await expect(
        new GetWeatherSettingsUseCase(settings).execute('user-1'),
      ).resolves.toEqual(saved);
      await expect(
        new GetWeatherSettingsUseCase(settings).execute('user-2'),
      ).resolves.toMatchObject({ locationMode: null });
    });
  });

  describe('SearchCitiesUseCase', () => {
    it('returns the matching cities', async () => {
      const search = new SearchCitiesUseCase(new FakeCityGeocoder());

      await expect(search.execute({ q: 'ly', lang: 'fr' })).resolves.toEqual([
        LYON,
      ]);
    });
  });
});
