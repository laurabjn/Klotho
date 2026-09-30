import { z } from 'zod';

export const TEMPERATURE_UNITS = ['celsius', 'fahrenheit'] as const;
export type TemperatureUnit = (typeof TEMPERATURE_UNITS)[number];

/** Simplified conditions, enough for the outfit engine (clear, rain, snow…). */
export const WEATHER_CONDITIONS = [
  'clear',
  'cloudy',
  'fog',
  'rain',
  'snow',
  'storm',
] as const;
export type WeatherCondition = (typeof WEATHER_CONDITIONS)[number];

/**
 * "device": the phone position, sent with each request and never stored.
 * "city": the city saved in the settings.
 */
export const LOCATION_MODES = ['device', 'city'] as const;
export type LocationMode = (typeof LOCATION_MODES)[number];

const latitude = z
  .number()
  .min(-90, { error: 'errors.weather.coordinates' })
  .max(90, { error: 'errors.weather.coordinates' });
const longitude = z
  .number()
  .min(-180, { error: 'errors.weather.coordinates' })
  .max(180, { error: 'errors.weather.coordinates' });

/** A city picked from the search: its own coordinates, not the user's. */
export const citySchema = z.object({
  name: z.string().trim().min(1).max(100),
  /** ISO 3166 country code, e.g. "FR". */
  country: z.string().trim().length(2).toUpperCase(),
  region: z.string().trim().max(100).nullable().default(null),
  latitude,
  longitude,
});
export type City = z.output<typeof citySchema>;

export const weatherSettingsSchema = z
  .object({
    /** null = not set up: only a manually entered temperature is used. */
    locationMode: z
      .enum(LOCATION_MODES, { error: 'errors.weather.locationMode' })
      .nullable()
      .default(null),
    /** Also the fallback of the "device" mode when the position is unavailable. */
    city: citySchema.nullable().default(null),
    temperatureUnit: z
      .enum(TEMPERATURE_UNITS, { error: 'errors.weather.unit' })
      .default('celsius'),
  })
  .refine((settings) => settings.locationMode !== 'city' || settings.city, {
    path: ['city'],
    error: 'errors.weather.cityRequired',
  });
export type WeatherSettingsInput = z.input<typeof weatherSettingsSchema>;
export type WeatherSettings = z.output<typeof weatherSettingsSchema>;

/** GET /weather/current: the phone position, or nothing to use the saved city. */
export const currentWeatherQuerySchema = z
  .object({
    latitude: z.coerce.number().pipe(latitude).optional(),
    longitude: z.coerce.number().pipe(longitude).optional(),
  })
  .refine(
    (query) =>
      (query.latitude === undefined) === (query.longitude === undefined),
    { error: 'errors.weather.coordinates' },
  );
export type CurrentWeatherQuery = z.output<typeof currentWeatherQuerySchema>;

export const CITY_QUERY_MIN_LENGTH = 2;

export const citySearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(CITY_QUERY_MIN_LENGTH, { error: 'errors.weather.query' })
    .max(80, { error: 'errors.weather.query' }),
  lang: z.enum(['fr', 'en']).default('fr'),
});
export type CitySearchQuery = z.output<typeof citySearchQuerySchema>;

/** Temperatures are always in °C in the API; the app converts for display. */
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: WeatherCondition;
  /** Rain + snow over the last hour, in mm. */
  precipitation: number;
  /** In km/h. */
  windSpeed: number;
  locationName: string | null;
  /** ISO date of the observation. */
  observedAt: string;
  source: LocationMode;
}

export const toFahrenheit = (celsius: number): number => (celsius * 9) / 5 + 32;
export const toCelsius = (fahrenheit: number): number =>
  ((fahrenheit - 32) * 5) / 9;

/** Rounded temperature in the user's unit, e.g. 12.6 °C → 13 or 55 (°F). */
export const displayTemperature = (
  celsius: number,
  unit: TemperatureUnit,
): number =>
  Math.round(unit === 'fahrenheit' ? toFahrenheit(celsius) : celsius);
