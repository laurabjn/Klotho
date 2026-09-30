import { Logger } from '@nestjs/common';
import type { City, WeatherCondition } from '@klotho/shared';
import { z } from 'zod';

import { WeatherUnavailableError } from '../../domain/weather/errors';
import type { CityGeocoder } from '../../domain/weather/ports/city-geocoder';
import type { WeatherProvider } from '../../domain/weather/ports/weather-provider';
import {
  coarsen,
  type Weather,
} from '../../domain/weather/value-objects/weather';

export interface OpenWeatherMapConfig {
  /** Without a key, the weather is simply unavailable (local development). */
  apiKey: string | undefined;
  timeoutMs: number;
}

type Fetch = (url: URL, init: RequestInit) => Promise<Response>;

const BASE_URL = 'https://api.openweathermap.org';

// Only the fields we use; anything else in the answer is ignored.
const currentWeatherResponse = z.object({
  weather: z.array(z.object({ id: z.number().int() })).min(1),
  main: z.object({ temp: z.number(), feels_like: z.number() }),
  wind: z.object({ speed: z.number() }).optional(),
  rain: z.object({ '1h': z.number().optional() }).optional(),
  snow: z.object({ '1h': z.number().optional() }).optional(),
  dt: z.number(),
  name: z.string().optional(),
});

const geocodingResponse = z.array(
  z.object({
    name: z.string(),
    local_names: z.record(z.string(), z.string()).optional(),
    lat: z.number(),
    lon: z.number(),
    country: z.string().length(2),
    state: z.string().optional(),
  }),
);

/** https://openweathermap.org/weather-conditions */
function toCondition(id: number): WeatherCondition {
  if (id >= 200 && id < 300) return 'storm';
  if (id >= 300 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'fog';
  return id === 800 ? 'clear' : 'cloudy';
}

const oneDecimal = (value: number) => Math.round(value * 10) / 10;

/** Current weather and city search, with the free OpenWeatherMap APIs. */
export class OpenWeatherMapClient implements WeatherProvider, CityGeocoder {
  private readonly logger = new Logger(OpenWeatherMapClient.name);

  constructor(
    private readonly config: OpenWeatherMapConfig,
    private readonly fetchFn: Fetch = fetch,
  ) {}

  async getCurrentWeather(
    latitude: number,
    longitude: number,
  ): Promise<Weather> {
    const answer = await this.get('/data/2.5/weather', currentWeatherResponse, {
      lat: String(latitude),
      lon: String(longitude),
      units: 'metric',
    });
    const precipitation =
      (answer.rain?.['1h'] ?? 0) + (answer.snow?.['1h'] ?? 0);
    return {
      temperature: oneDecimal(answer.main.temp),
      feelsLike: oneDecimal(answer.main.feels_like),
      condition: toCondition(answer.weather[0]!.id),
      precipitation: oneDecimal(precipitation),
      // m/s → km/h
      windSpeed: oneDecimal((answer.wind?.speed ?? 0) * 3.6),
      locationName: answer.name || null,
      observedAt: new Date(answer.dt * 1000),
    };
  }

  async search(query: string, language: 'fr' | 'en'): Promise<City[]> {
    const answer = await this.get('/geo/1.0/direct', geocodingResponse, {
      q: query,
      limit: '5',
    });
    const cities = answer.map((place) => ({
      name: place.local_names?.[language] ?? place.name,
      country: place.country.toUpperCase(),
      region: place.state ?? null,
      ...coarsen({ latitude: place.lat, longitude: place.lon }),
    }));
    // The API often returns the same city twice (slightly different points).
    const seen = new Set<string>();
    return cities.filter((city) => {
      const key = `${city.name}|${city.region}|${city.country}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async get<S extends z.ZodType>(
    path: string,
    schema: S,
    params: Record<string, string>,
  ): Promise<z.output<S>> {
    if (!this.config.apiKey) {
      throw new WeatherUnavailableError('OPENWEATHER_API_KEY is not set');
    }
    const url = new URL(path, BASE_URL);
    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(name, value);
    }
    url.searchParams.set('appid', this.config.apiKey);

    // Never log the URL: it holds the API key and the position.
    let response: Response;
    try {
      response = await this.fetchFn(url, {
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'unknown';
      this.logger.warn(`${path} failed (${reason})`);
      throw new WeatherUnavailableError();
    }
    if (!response.ok) {
      this.logger.warn(`${path} answered ${response.status}`);
      throw new WeatherUnavailableError();
    }

    const parsed = schema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) {
      this.logger.warn(`${path} returned an unexpected answer`);
      throw new WeatherUnavailableError();
    }
    return parsed.data;
  }
}
