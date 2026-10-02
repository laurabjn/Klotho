import type { Clock } from '../../domain/shared/ports/clock';
import type { WeatherProvider } from '../../domain/weather/ports/weather-provider';
import type {
  DailyForecast,
  Weather,
} from '../../domain/weather/value-objects/weather';

export interface WeatherCacheOptions {
  ttlMs: number;
  /** Bounds the memory used; the oldest place is forgotten first. */
  maxEntries: number;
}

/** A bounded map whose entries expire; failures are never kept. */
class ExpiringCache<T> {
  private readonly entries = new Map<string, { value: T; expiresAt: number }>();

  constructor(
    private readonly clock: Clock,
    private readonly options: WeatherCacheOptions,
  ) {}

  async get(key: string, load: () => Promise<T>): Promise<T> {
    const now = this.clock.now().getTime();
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > now) return hit.value;

    const value = await load();
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: now + this.options.ttlMs });
    if (this.entries.size > this.options.maxEntries) {
      this.entries.delete(this.entries.keys().next().value!);
    }
    return value;
  }
}

const placeKey = (latitude: number, longitude: number) =>
  `${latitude.toFixed(2)},${longitude.toFixed(2)}`;

/**
 * Short in-memory cache: the weather of a place barely changes in 10
 * minutes, its forecast even less.
 */
export class CachedWeatherProvider implements WeatherProvider {
  private readonly current: ExpiringCache<Weather>;
  private readonly forecasts: ExpiringCache<DailyForecast[]>;

  constructor(
    private readonly inner: WeatherProvider,
    clock: Clock,
    options: WeatherCacheOptions,
  ) {
    this.current = new ExpiringCache(clock, options);
    this.forecasts = new ExpiringCache(clock, options);
  }

  getCurrentWeather(latitude: number, longitude: number): Promise<Weather> {
    return this.current.get(placeKey(latitude, longitude), () =>
      this.inner.getCurrentWeather(latitude, longitude),
    );
  }

  getDailyForecast(
    latitude: number,
    longitude: number,
  ): Promise<DailyForecast[]> {
    return this.forecasts.get(placeKey(latitude, longitude), () =>
      this.inner.getDailyForecast(latitude, longitude),
    );
  }
}
