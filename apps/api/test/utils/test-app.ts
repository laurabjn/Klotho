import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';

import { AppModule } from '../../src/app.module';
import { FILE_STORAGE } from '../../src/domain/storage/ports/file-storage';
import { MAILER } from '../../src/domain/notifications/ports/mailer';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { CITY_GEOCODER } from '../../src/domain/weather/ports/city-geocoder';
import { WEATHER_PROVIDER } from '../../src/domain/weather/ports/weather-provider';
import { SpyMailer } from '../../src/testing/fakes';
import { InMemoryFileStorage } from '../../src/testing/storage-fakes';
import {
  FakeCityGeocoder,
  FakeWeatherProvider,
  SUNNY,
} from '../../src/testing/weather-fakes';

export interface TestApp {
  app: INestApplication<App>;
  prisma: PrismaService;
  mailer: SpyMailer;
  storage: InMemoryFileStorage;
  weather: FakeWeatherProvider;
  /** Empties every table (the database name is guaranteed to end with _test). */
  reset(): Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const mailer = new SpyMailer();
  const storage = new InMemoryFileStorage();
  const weather = new FakeWeatherProvider();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MAILER)
    .useValue(mailer)
    .overrideProvider(FILE_STORAGE)
    .useValue(storage)
    .overrideProvider(WEATHER_PROVIDER)
    .useValue(weather)
    .overrideProvider(CITY_GEOCODER)
    .useValue(new FakeCityGeocoder())
    .compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  await app.init();
  const prisma = app.get(PrismaService);

  return {
    app,
    prisma,
    mailer,
    storage,
    weather,
    async reset() {
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
      mailer.passwordResets.length = 0;
      storage.files.clear();
      weather.calls.length = 0;
      weather.weather = SUNNY;
      weather.failing = false;
    },
  };
}
