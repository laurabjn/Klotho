import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';

import { AppModule } from '../../src/app.module';
import { MAILER } from '../../src/domain/notifications/ports/mailer';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { SpyMailer } from '../../src/testing/fakes';

export interface TestApp {
  app: INestApplication<App>;
  prisma: PrismaService;
  mailer: SpyMailer;
  /** Empties every table (the database name is guaranteed to end with _test). */
  reset(): Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const mailer = new SpyMailer();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MAILER)
    .useValue(mailer)
    .compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  await app.init();
  const prisma = app.get(PrismaService);

  return {
    app,
    prisma,
    mailer,
    async reset() {
      await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
      mailer.passwordResets.length = 0;
    },
  };
}
