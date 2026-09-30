// Runs the outfit engine for an account and prints the looks:
//   npm run outfits:demo -w @klotho/api -- --temperature 12 --occasion work
// Options: --email, --temperature (°C), --style, --occasion, --impose "<name>",
// --rain, --no-heels, --no-color <key>.
import { NestFactory } from '@nestjs/core';
import { OCCASIONS, STYLES, type Occasion, type Style } from '@klotho/shared';

import { AppModule } from '../app.module';
import { GenerateOutfitsUseCase } from '../application/outfits/generate-outfits.use-case';
import { OutfitGeneratorService } from '../application/outfits/outfit-generator.service';
import {
  STYLE_PROFILE_REPOSITORY,
  type StyleProfileRepository,
} from '../domain/preferences/ports/style-profile.repository';
import { CLOCK, type Clock } from '../domain/shared/ports/clock';
import {
  WARDROBE_REPOSITORY,
  type WardrobeRepository,
} from '../domain/wardrobe/ports/wardrobe.repository';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { DEMO_ACCOUNT } from './demo-data';

const ROLE_LABELS: Record<string, string> = {
  top: 'Haut',
  bottom: 'Bas',
  dress: 'Robe',
  layer: 'Veste',
  shoes: 'Chaussures',
  bag: 'Sac',
  jewelry: 'Bijou',
  accessory: 'Accessoire',
};

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}
const flag = (name: string) => process.argv.includes(`--${name}`);

function oneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  name: string,
): T | null {
  if (value === undefined) return null;
  if (!allowed.includes(value as T)) {
    throw new Error(`--${name} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

async function main() {
  const email = option('email') ?? DEMO_ACCOUNT.email;
  const temperature = Number(option('temperature') ?? 15);
  const style = oneOf<Style>(option('style'), STYLES, 'style');
  const occasion = oneOf<Occasion>(option('occasion'), OCCASIONS, 'occasion');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const prisma = app.get(PrismaService);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`No account ${email}: run db:seed:demo first.`);

    const items = await prisma.wardrobeItem.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, subcategory: true },
    });
    const names = new Map(
      items.map((item) => [item.id, item.name ?? item.subcategory ?? item.id]),
    );
    const impose = option('impose');
    const imposed = impose
      ? items.find((item) =>
          item.name?.toLowerCase().includes(impose.toLowerCase()),
        )
      : undefined;
    if (impose && !imposed) throw new Error(`No piece named "${impose}".`);

    const generate = new GenerateOutfitsUseCase(
      app.get<WardrobeRepository>(WARDROBE_REPOSITORY),
      app.get<StyleProfileRepository>(STYLE_PROFILE_REPOSITORY),
      new OutfitGeneratorService(),
      app.get<Clock>(CLOCK),
    );
    const outfits = await generate.execute(user.id, {
      style,
      occasion,
      temperature,
      condition: flag('rain') ? 'rain' : 'clear',
      precipitation: flag('rain') ? 2 : 0,
      imposedItemId: imposed?.id ?? null,
      exclusions: {
        itemIds: [],
        categories: [],
        subcategories: flag('no-heels') ? ['pumps'] : [],
        colors: option('no-color') ? [option('no-color') as never] : [],
      },
    });

    console.log(
      `\n${outfits.length} tenue(s) pour ${email} — ${temperature} °C` +
        `${flag('rain') ? ', pluie' : ''}` +
        `${style ? `, style ${style}` : ''}` +
        `${occasion ? `, occasion ${occasion}` : ''}` +
        `${imposed ? `, pièce imposée « ${imposed.name} »` : ''}\n`,
    );
    for (const [index, outfit] of outfits.entries()) {
      console.log(`${index + 1}. Score ${outfit.score} / 100`);
      for (const piece of outfit.pieces) {
        console.log(
          `   ${ROLE_LABELS[piece.role]!.padEnd(11)} ${names.get(piece.itemId)}`,
        );
      }
      const detail = Object.entries(outfit.breakdown)
        .map(([name, value]) => `${name} ${Math.round(value * 100)}`)
        .join(' · ');
      console.log(`   (${detail})\n`);
    }
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
