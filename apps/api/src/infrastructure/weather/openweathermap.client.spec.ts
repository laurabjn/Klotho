import { WeatherUnavailableError } from '../../domain/weather/errors';
import { OpenWeatherMapClient } from './openweathermap.client';

const current = {
  weather: [{ id: 500, main: 'Rain' }],
  main: { temp: 12.44, feels_like: 10.96 },
  wind: { speed: 5 },
  rain: { '1h': 0.8 },
  dt: 1790841600,
  name: 'Lyon',
};

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('OpenWeatherMapClient', () => {
  let fetchMock: jest.Mock<Promise<Response>, [URL, RequestInit]>;
  const client = ({ apiKey = 'secret-key' }: { apiKey?: string } = {}) =>
    new OpenWeatherMapClient({ apiKey, timeoutMs: 1000 }, fetchMock);
  const requestedUrl = () => fetchMock.mock.calls[0]![0];

  beforeEach(() => {
    fetchMock = jest.fn<Promise<Response>, [URL, RequestInit]>();
  });

  describe('getCurrentWeather', () => {
    it('asks for metric values at the position', async () => {
      fetchMock.mockReturnValue(json(current));

      await client().getCurrentWeather(45.76, 4.84);

      const url = requestedUrl();
      expect(url.origin + url.pathname).toBe(
        'https://api.openweathermap.org/data/2.5/weather',
      );
      expect(Object.fromEntries(url.searchParams)).toEqual({
        lat: '45.76',
        lon: '4.84',
        units: 'metric',
        appid: 'secret-key',
      });
      expect(fetchMock.mock.calls[0]![1].signal).toBeInstanceOf(AbortSignal);
    });

    it('maps the answer to the domain weather', async () => {
      fetchMock.mockReturnValue(json(current));

      await expect(client().getCurrentWeather(45.76, 4.84)).resolves.toEqual({
        temperature: 12.4,
        feelsLike: 11,
        condition: 'rain',
        precipitation: 0.8,
        windSpeed: 18,
        locationName: 'Lyon',
        observedAt: new Date(1790841600 * 1000),
      });
    });

    it.each([
      [200, 'storm'],
      [301, 'rain'],
      [511, 'rain'],
      [601, 'snow'],
      [741, 'fog'],
      [800, 'clear'],
      [801, 'cloudy'],
      [804, 'cloudy'],
    ])('reads condition %i as "%s"', async (id, condition) => {
      fetchMock.mockReturnValue(json({ ...current, weather: [{ id }] }));

      await expect(
        client().getCurrentWeather(45.76, 4.84),
      ).resolves.toMatchObject({ condition });
    });

    it('adds rain and snow, and accepts no precipitation nor name', async () => {
      fetchMock.mockReturnValue(
        json({ ...current, rain: undefined, snow: { '1h': 1.2 }, name: '' }),
      );
      await expect(
        client().getCurrentWeather(45.76, 4.84),
      ).resolves.toMatchObject({ precipitation: 1.2, locationName: null });
    });

    it.each([
      ['a network error', () => Promise.reject(new TypeError('fetch failed'))],
      ['a timeout', () => Promise.reject(new DOMException('', 'TimeoutError'))],
      ['an error status', () => json({ cod: 401 }, 401)],
      ['an unexpected answer', () => json({ weather: [] })],
    ])('reports %s as unavailable weather', async (_, answer) => {
      fetchMock.mockImplementation(answer);

      await expect(
        client().getCurrentWeather(45.76, 4.84),
      ).rejects.toBeInstanceOf(WeatherUnavailableError);
    });

    it('is unavailable without an API key, without calling out', async () => {
      await expect(
        client({ apiKey: '' }).getCurrentWeather(45.76, 4.84),
      ).rejects.toBeInstanceOf(WeatherUnavailableError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    const lyon = {
      name: 'Lyon',
      local_names: { fr: 'Lyon', en: 'Lyons' },
      lat: 45.7578137,
      lon: 4.8320114,
      country: 'FR',
      state: 'Auvergne-Rhône-Alpes',
    };

    it('finds cities, named in the requested language', async () => {
      fetchMock.mockReturnValue(json([lyon]));

      await expect(client().search('Lyon', 'en')).resolves.toEqual([
        {
          name: 'Lyons',
          country: 'FR',
          region: 'Auvergne-Rhône-Alpes',
          latitude: 45.76,
          longitude: 4.83,
        },
      ]);
      const url = requestedUrl();
      expect(url.pathname).toBe('/geo/1.0/direct');
      expect(url.searchParams.get('q')).toBe('Lyon');
      expect(url.searchParams.get('limit')).toBe('5');
    });

    it('drops duplicates and keeps the default name when not translated', async () => {
      const { local_names: _names, ...plain } = lyon;
      fetchMock.mockReturnValue(json([plain, { ...plain, lat: 45.7579 }]));

      await expect(client().search('Lyon', 'fr')).resolves.toEqual([
        expect.objectContaining({ name: 'Lyon' }),
      ]);
    });
  });
});
