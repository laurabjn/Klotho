import { Injectable } from '@nestjs/common';
import type {
  LocationMode,
  TemperatureUnit,
  WeatherSettings,
} from '@klotho/shared';

import type { WeatherSettingsRepository } from '../../../domain/weather/ports/weather-settings.repository';
import type { WeatherSettings as WeatherSettingsRow } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma.service';

// Values are validated by the shared schema before being stored.
function toSettings(row: WeatherSettingsRow): WeatherSettings {
  const hasCity =
    row.cityName !== null &&
    row.cityCountry !== null &&
    row.cityLatitude !== null &&
    row.cityLongitude !== null;
  return {
    locationMode: row.locationMode as LocationMode | null,
    city: hasCity
      ? {
          name: row.cityName!,
          country: row.cityCountry!,
          region: row.cityRegion,
          latitude: row.cityLatitude!,
          longitude: row.cityLongitude!,
        }
      : null,
    temperatureUnit: row.temperatureUnit as TemperatureUnit,
  };
}

function toColumns({ locationMode, city, temperatureUnit }: WeatherSettings) {
  return {
    locationMode,
    cityName: city?.name ?? null,
    cityCountry: city?.country ?? null,
    cityRegion: city?.region ?? null,
    cityLatitude: city?.latitude ?? null,
    cityLongitude: city?.longitude ?? null,
    temperatureUnit,
  };
}

@Injectable()
export class PrismaWeatherSettingsRepository implements WeatherSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string): Promise<WeatherSettings | null> {
    const row = await this.prisma.weatherSettings.findUnique({
      where: { userId },
    });
    return row ? toSettings(row) : null;
  }

  async save(
    userId: string,
    settings: WeatherSettings,
  ): Promise<WeatherSettings> {
    const columns = toColumns(settings);
    return toSettings(
      await this.prisma.weatherSettings.upsert({
        where: { userId },
        create: { ...columns, userId },
        update: columns,
      }),
    );
  }
}
