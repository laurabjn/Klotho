import { Module } from '@nestjs/common';

import { GetCurrentWeatherUseCase } from '../../../application/weather/get-current-weather.use-case';
import {
  GetWeatherSettingsUseCase,
  SearchCitiesUseCase,
  UpdateWeatherSettingsUseCase,
} from '../../../application/weather/weather-settings.use-cases';
import {
  CITY_GEOCODER,
  type CityGeocoder,
} from '../../../domain/weather/ports/city-geocoder';
import {
  WEATHER_PROVIDER,
  type WeatherProvider,
} from '../../../domain/weather/ports/weather-provider';
import {
  WEATHER_SETTINGS_REPOSITORY,
  type WeatherSettingsRepository,
} from '../../../domain/weather/ports/weather-settings.repository';
import { WeatherController } from './weather.controller';

@Module({
  controllers: [WeatherController],
  providers: [
    {
      provide: GetCurrentWeatherUseCase,
      inject: [WEATHER_PROVIDER, WEATHER_SETTINGS_REPOSITORY],
      useFactory: (
        provider: WeatherProvider,
        settings: WeatherSettingsRepository,
      ) => new GetCurrentWeatherUseCase(provider, settings),
    },
    ...[GetWeatherSettingsUseCase, UpdateWeatherSettingsUseCase].map(
      (UseCase) => ({
        provide: UseCase,
        inject: [WEATHER_SETTINGS_REPOSITORY],
        useFactory: (settings: WeatherSettingsRepository) =>
          new UseCase(settings),
      }),
    ),
    {
      provide: SearchCitiesUseCase,
      inject: [CITY_GEOCODER],
      useFactory: (geocoder: CityGeocoder) => new SearchCitiesUseCase(geocoder),
    },
  ],
})
export class WeatherModule {}
