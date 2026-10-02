import type { PlanForecast } from '../../domain/planning/ports/outfit-plan.repository';
import type { WeatherProvider } from '../../domain/weather/ports/weather-provider';
import type { WeatherSettingsRepository } from '../../domain/weather/ports/weather-settings.repository';

/**
 * The weather of the days to plan, at the city saved in the settings (the
 * phone position is never stored, so without a city there is none). The
 * weather is a bonus: a provider failure only means no forecast.
 */
export class DayForecasts {
  constructor(
    private readonly provider: WeatherProvider,
    private readonly settings: WeatherSettingsRepository,
  ) {}

  /** By day (YYYY-MM-DD); about 5 days ahead, empty when unknown. */
  async byDay(userId: string): Promise<Map<string, PlanForecast>> {
    const city = (await this.settings.findByUser(userId))?.city;
    if (!city) return new Map();
    try {
      const days = await this.provider.getDailyForecast(
        city.latitude,
        city.longitude,
      );
      return new Map(
        days.map(({ day, temperature, condition }) => [
          day,
          { temperature, condition },
        ]),
      );
    } catch {
      return new Map();
    }
  }

  /** The weather now at the saved city, rounded; null when unknown. */
  async current(userId: string): Promise<PlanForecast | null> {
    const city = (await this.settings.findByUser(userId))?.city;
    if (!city) return null;
    try {
      const weather = await this.provider.getCurrentWeather(
        city.latitude,
        city.longitude,
      );
      return {
        temperature: Math.round(weather.temperature),
        condition: weather.condition,
      };
    } catch {
      return null;
    }
  }
}
