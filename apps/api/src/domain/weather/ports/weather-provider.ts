import type { DailyForecast, Weather } from '../value-objects/weather';

/**
 * External weather service (OpenWeatherMap today), replaceable. Implementations
 * throw WeatherUnavailableError on timeout or failure.
 */
export interface WeatherProvider {
  getCurrentWeather(latitude: number, longitude: number): Promise<Weather>;
  /** The next days (about 5), first day first. */
  getDailyForecast(
    latitude: number,
    longitude: number,
  ): Promise<DailyForecast[]>;
}

export const WEATHER_PROVIDER = Symbol('WeatherProvider');
