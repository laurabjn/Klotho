import type { Clock } from '../../domain/shared/ports/clock';
import type { WeatherProvider } from '../../domain/weather/ports/weather-provider';
import type { Weather } from '../../domain/weather/value-objects/weather';

export interface WeatherCacheOptions {
  ttlMs: number;
  /** Bounds the memory used; the oldest place is forgotten first. */
  maxEntries: number;
}

/** Short in-memory cache: the weather of a place barely changes in 10 minutes. */
export class CachedWeatherProvider implements WeatherProvider {
  private readonly entries = new Map<
    string,
    { weather: Weather; expiresAt: number }
  >();

  constructor(
    private readonly inner: WeatherProvider,
    private readonly clock: Clock,
    private readonly options: WeatherCacheOptions,
  ) {}

  async getCurrentWeather(
    latitude: number,
    longitude: number,
  ): Promise<Weather> {
    const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const now = this.clock.now().getTime();
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > now) return hit.weather;

    const weather = await this.inner.getCurrentWeather(latitude, longitude);
    this.entries.delete(key);
    this.entries.set(key, { weather, expiresAt: now + this.options.ttlMs });
    if (this.entries.size > this.options.maxEntries) {
      this.entries.delete(this.entries.keys().next().value!);
    }
    return weather;
  }
}
