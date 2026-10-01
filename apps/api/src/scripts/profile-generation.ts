// Times the outfit engine on synthetic wardrobes of 100, 300 and 1000 pieces:
//   npm run profile:generation -w @klotho/api [-- --runs 30 --sizes 100,1000]
// In memory only (no database): it measures the engine, not the queries.
import { styleProfileSchema } from '@klotho/shared';

import {
  DEFAULT_ENGINE_SETTINGS,
  OutfitGeneratorService,
  type OutfitGenerationRequest,
} from '../application/outfits/outfit-generator.service';
import { keyOfMainPieces } from '../domain/outfits/entities/outfit-candidate';
import { syntheticFeedback, syntheticWardrobe } from './synthetic-wardrobe';

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index]!;
}

const TODAY = new Date('2026-10-01T08:00:00.000Z');

/** Two typical requests: a plain day, and a styled one with an occasion. */
function scenarios(
  wardrobe: ReturnType<typeof syntheticWardrobe>,
): [string, OutfitGenerationRequest][] {
  const feedback = syntheticFeedback(wardrobe);
  const profile = styleProfileSchema.parse({
    preferredStyles: ['casual', 'chic'],
    preferredColors: ['navy', 'ecru'],
    avoidedColors: ['orange'],
  });
  const base = {
    temperature: 16,
    condition: 'cloudy' as const,
    precipitation: 0,
    windSpeed: 10,
    style: null,
    occasion: null,
    profile,
    today: TODAY,
    feedback,
  };
  return [
    ['plain day, 16 °C', { context: base }],
    [
      'chic, work, rain, 5 looks excluded',
      {
        context: {
          ...base,
          style: 'chic',
          occasion: 'work',
          condition: 'rain',
          precipitation: 2,
        },
        excludedOutfitKeys: feedback.disliked
          .slice(0, 5)
          .map((ids) => keyOfMainPieces(ids)),
      },
    ],
  ];
}

function main() {
  const runs = Number(option('runs') ?? 20);
  const sizes = (option('sizes') ?? '100,300,1000').split(',').map(Number);
  const engine = new OutfitGeneratorService(DEFAULT_ENGINE_SETTINGS);

  console.log(
    `Outfit engine, ${runs} runs per case (after 3 warm-up runs), maxPerRole ${DEFAULT_ENGINE_SETTINGS.maxPerRole}`,
  );
  console.log(
    'pieces | scenario                            | looks | median ms | p95 ms | max ms',
  );
  for (const size of sizes) {
    const wardrobe = syntheticWardrobe(size);
    for (const [name, request] of scenarios(wardrobe)) {
      let looks = 0;
      for (let i = 0; i < 3; i++) engine.generate(wardrobe, request);
      const timings: number[] = [];
      for (let i = 0; i < runs; i++) {
        const start = performance.now();
        looks = engine.generate(wardrobe, request).length;
        timings.push(performance.now() - start);
      }
      timings.sort((a, b) => a - b);
      console.log(
        [
          String(size).padStart(6),
          name.padEnd(35),
          String(looks).padStart(5),
          percentile(timings, 50).toFixed(1).padStart(9),
          percentile(timings, 95).toFixed(1).padStart(6),
          timings[timings.length - 1]!.toFixed(1).padStart(6),
        ].join(' | '),
      );
    }
  }
}

main();
