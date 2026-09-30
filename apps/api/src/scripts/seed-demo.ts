// Creates (or recreates) the demo account: npm run db:seed:demo -w @klotho/api
import { NestFactory } from '@nestjs/core';
import { styleProfileSchema, weatherSettingsSchema } from '@klotho/shared';

import { AppModule } from '../app.module';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../domain/auth/ports/password-hasher';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import {
  DEMO_ACCOUNT,
  DEMO_CITY,
  DEMO_PROFILE,
  DEMO_WARDROBE,
} from './demo-data';

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The demo account is for development only.');
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const prisma = app.get(PrismaService);
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);

    // Starts from scratch each time: the cascade removes the pieces, profile…
    await prisma.user.deleteMany({ where: { email: DEMO_ACCOUNT.email } });
    const user = await prisma.user.create({
      data: {
        email: DEMO_ACCOUNT.email,
        firstName: DEMO_ACCOUNT.firstName,
        passwordHash: await hasher.hash(DEMO_ACCOUNT.password),
      },
    });

    const profile = styleProfileSchema.parse(DEMO_PROFILE);
    await prisma.styleProfile.create({ data: { ...profile, userId: user.id } });

    const settings = weatherSettingsSchema.parse({
      locationMode: 'city',
      city: DEMO_CITY,
    });
    await prisma.weatherSettings.create({
      data: {
        userId: user.id,
        locationMode: settings.locationMode,
        cityName: settings.city!.name,
        cityCountry: settings.city!.country,
        cityRegion: settings.city!.region,
        cityLatitude: settings.city!.latitude,
        cityLongitude: settings.city!.longitude,
        temperatureUnit: settings.temperatureUnit,
      },
    });

    const now = Date.now();
    for (const [index, { worn, ...item }] of DEMO_WARDROBE.entries()) {
      await prisma.wardrobeItem.create({
        data: {
          ...item,
          userId: user.id,
          secondaryColors: item.secondaryColors ?? [],
          styles: item.styles ?? [],
          seasons: item.seasons ?? [],
          wearCount: worn?.count ?? 0,
          lastWornAt: worn ? new Date(now - worn.daysAgo * DAY) : null,
          // Spread over the last weeks, so "most recent" has a meaning.
          createdAt: new Date(now - (DEMO_WARDROBE.length - index) * DAY),
        },
      });
    }

    console.log(
      [
        '',
        `Compte de démo prêt : ${DEMO_WARDROBE.length} pièces, profil de style, météo à ${DEMO_CITY.name}.`,
        `  Email        : ${DEMO_ACCOUNT.email}`,
        `  Mot de passe : ${DEMO_ACCOUNT.password}`,
        '',
      ].join('\n'),
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
