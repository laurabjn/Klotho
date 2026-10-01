// Creates (or recreates) the demo account: npm run db:seed:demo -w @klotho/api
import { NestFactory } from '@nestjs/core';
import { styleProfileSchema, weatherSettingsSchema } from '@klotho/shared';

import { AppModule } from '../app.module';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../domain/auth/ports/password-hasher';
import type {
  Outfit,
  OutfitCandidate,
  OutfitContext,
} from '../domain/outfits/entities/outfit-candidate';
import {
  OUTFIT_REPOSITORY,
  type OutfitRepository,
} from '../domain/outfits/ports/outfit.repository';
import { scoreOutfit } from '../domain/outfits/scoring/outfit-score';
import { ROLE_OF } from '../domain/outfits/services/outfit-combination-builder';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import {
  DEMO_ACCOUNT,
  DEMO_CITY,
  DEMO_LOOKS,
  DEMO_PROFILE,
  DEMO_WARDROBE,
} from './demo-data';

const DAY = 24 * 60 * 60 * 1000;

/** The day in the local calendar (the one of the person running the seed). */
const localDay = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

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
    const outfits = app.get<OutfitRepository>(OUTFIT_REPOSITORY);

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
    const byName = new Map<string, OutfitCandidate>();
    for (const [
      index,
      { worn, favorite, ...item },
    ] of DEMO_WARDROBE.entries()) {
      const row = await prisma.wardrobeItem.create({
        data: {
          ...item,
          userId: user.id,
          isFavorite: favorite ?? false,
          secondaryColors: item.secondaryColors ?? [],
          styles: item.styles ?? [],
          seasons: item.seasons ?? [],
          wearCount: worn?.count ?? 0,
          lastWornAt: worn ? new Date(now - worn.daysAgo * DAY) : null,
          // Spread over the last weeks, so "most recent" has a meaning.
          createdAt: new Date(now - (DEMO_WARDROBE.length - index) * DAY),
        },
      });
      byName.set(item.name, row as OutfitCandidate);
    }

    // Looks go through the repository: wears update the pieces like the app.
    let wears = 0;
    for (const look of DEMO_LOOKS) {
      const outfit: Outfit = {
        pieces: look.pieces.map((name) => {
          const item = byName.get(name);
          if (!item) throw new Error(`No demo piece named "${name}".`);
          return { role: ROLE_OF[item.category]!, item };
        }),
      };
      const context: OutfitContext = {
        temperature: look.temperature,
        condition: look.condition,
        precipitation: look.condition === 'rain' ? 2 : 0,
        windSpeed: 0,
        style: look.style,
        occasion: look.occasion,
        profile,
        today: new Date(now),
      };
      const { score, breakdown } = scoreOutfit(outfit, context);
      const [saved] = await outfits.createMany(user.id, [
        {
          style: look.style,
          occasion: look.occasion,
          temperature: look.temperature,
          condition: look.condition,
          pieces: outfit.pieces.map((p) => ({
            role: p.role,
            itemId: p.item.id,
          })),
          score: Math.round(score * 10) / 10,
          breakdown,
          variantOf: null,
        },
      ]);
      const createdAt = new Date(now - look.daysAgo * DAY);
      await prisma.outfit.update({
        where: { id: saved!.id },
        data: {
          createdAt,
          ...(look.favorite && { isFavorite: true, favoritedAt: createdAt }),
        },
      });
      if (look.feedback) {
        const { rating, reasons = [], note = null } = look.feedback;
        await outfits.saveFeedback(user.id, saved!.id, {
          rating,
          reasons: rating === 'dislike' ? reasons : [],
          note,
        });
      }
      for (const daysAgo of look.wornDaysAgo ?? []) {
        await outfits.markWorn(
          user.id,
          saved!.id,
          localDay(new Date(now - daysAgo * DAY)),
        );
        wears += 1;
      }
    }

    console.log(
      [
        '',
        `Compte de démo prêt : ${DEMO_WARDROBE.length} pièces, ${DEMO_LOOKS.length} tenues (${wears} jours portés), profil de style, météo à ${DEMO_CITY.name}.`,
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
