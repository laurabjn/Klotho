import type { Weather } from '../value-objects/weather';

/**
 * External weather service (OpenWeatherMap today), replaceable. Implementations
 * throw WeatherUnavailableError on timeout or failure.
 */
export interface WeatherProvider {
  getCurrentWeather(latitude: number, longitude: number): Promise<Weather>;
}

export const WEATHER_PROVIDER = Symbol('WeatherProvider');
