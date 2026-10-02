import { FixedClock, MINUTE } from '../../testing/fakes';
import { FakeWeatherProvider } from '../../testing/weather-fakes';
import { CachedWeatherProvider } from './cached-weather-provider';

describe('CachedWeatherProvider', () => {
  let inner: FakeWeatherProvider;
  let clock: FixedClock;
  let cached: CachedWeatherProvider;

  beforeEach(() => {
    inner = new FakeWeatherProvider();
    clock = new FixedClock();
    cached = new CachedWeatherProvider(inner, clock, {
      ttlMs: 10 * MINUTE,
      maxEntries: 2,
    });
  });

  it('asks the provider once per place for 10 minutes', async () => {
    await cached.getCurrentWeather(45.76, 4.84);
    clock.advance(9 * MINUTE);
    await cached.getCurrentWeather(45.76, 4.84);
    expect(inner.calls).toHaveLength(1);

    clock.advance(2 * MINUTE);
    await cached.getCurrentWeather(45.76, 4.84);
    expect(inner.calls).toHaveLength(2);
  });

  it('keeps places apart', async () => {
    await cached.getCurrentWeather(45.76, 4.84);
    await cached.getCurrentWeather(48.85, 2.35);

    expect(inner.calls).toHaveLength(2);
  });

  it('does not keep failures', async () => {
    inner.failing = true;
    await expect(cached.getCurrentWeather(45.76, 4.84)).rejects.toThrow();

    inner.failing = false;
    await cached.getCurrentWeather(45.76, 4.84);
    expect(inner.calls).toHaveLength(2);
  });

  it('forgets the oldest place when full', async () => {
    await cached.getCurrentWeather(1, 1);
    await cached.getCurrentWeather(2, 2);
    await cached.getCurrentWeather(3, 3);
    await cached.getCurrentWeather(2, 2);
    expect(inner.calls).toHaveLength(3);

    await cached.getCurrentWeather(1, 1);
    expect(inner.calls).toHaveLength(4);
  });

  it('caches the forecast apart from the current weather', async () => {
    await cached.getCurrentWeather(45.76, 4.84);
    await cached.getDailyForecast(45.76, 4.84);
    clock.advance(9 * MINUTE);
    await expect(cached.getDailyForecast(45.76, 4.84)).resolves.toEqual(
      inner.forecast,
    );
    expect(inner.forecastCalls).toHaveLength(1);

    clock.advance(2 * MINUTE);
    await cached.getDailyForecast(45.76, 4.84);
    expect(inner.forecastCalls).toHaveLength(2);
    expect(inner.calls).toHaveLength(1);
  });
});
