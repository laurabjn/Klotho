import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import {
  citySearchQuerySchema,
  currentWeatherQuerySchema,
  weatherSettingsSchema,
  type City,
  type CitySearchQuery,
  type CurrentWeather,
  type CurrentWeatherQuery,
  type WeatherSettings,
} from '@klotho/shared';

import { GetCurrentWeatherUseCase } from '../../../application/weather/get-current-weather.use-case';
import {
  GetWeatherSettingsUseCase,
  SearchCitiesUseCase,
  UpdateWeatherSettingsUseCase,
} from '../../../application/weather/weather-settings.use-cases';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';

@Controller('weather')
export class WeatherController {
  constructor(
    private readonly currentWeather: GetCurrentWeatherUseCase,
    private readonly getSettings: GetWeatherSettingsUseCase,
    private readonly updateSettings: UpdateWeatherSettingsUseCase,
    private readonly searchCities: SearchCitiesUseCase,
  ) {}

  /** ?latitude=&longitude= for the phone position, nothing for the saved city. */
  @Get('current')
  current(
    @CurrentUserId() userId: string,
    @Query(new ZodValidationPipe(currentWeatherQuerySchema))
    query: CurrentWeatherQuery,
  ): Promise<CurrentWeather> {
    return this.currentWeather.execute(userId, query);
  }

  @Get('cities')
  cities(
    @Query(new ZodValidationPipe(citySearchQuerySchema))
    query: CitySearchQuery,
  ): Promise<City[]> {
    return this.searchCities.execute(query);
  }

  @Get('settings')
  settings(@CurrentUserId() userId: string): Promise<WeatherSettings> {
    return this.getSettings.execute(userId);
  }

  @Put('settings')
  replaceSettings(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(weatherSettingsSchema)) body: WeatherSettings,
  ): Promise<WeatherSettings> {
    return this.updateSettings.execute(userId, body);
  }
}
