import type { WeatherCondition } from '@klotho/shared';

/** Current weather at a place. Temperatures in °C, wind in km/h, rain in mm/h. */
export interface Weather {
  temperature: number;
  feelsLike: number;
  condition: WeatherCondition;
  precipitation: number;
  windSpeed: number;
  /** Name given by the provider, when it has one. */
  locationName: string | null;
  observedAt: Date;
}

/** Forecast of a local day (YYYY-MM-DD at the place). Temperature in °C, rounded. */
export interface DailyForecast {
  day: string;
  temperature: number;
  condition: WeatherCondition;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Rounds a position to 2 decimals (about 1 km): precise enough for the
 * weather, and the exact position of the user never leaves this layer.
 */
export function coarsen({ latitude, longitude }: Coordinates): Coordinates {
  const round = (value: number) => Math.round(value * 100) / 100;
  return { latitude: round(latitude), longitude: round(longitude) };
}
