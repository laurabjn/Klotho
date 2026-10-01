import { styleProfileSchema } from '@klotho/shared';

import { OutfitGeneratorService } from '../application/outfits/outfit-generator.service';
import { syntheticFeedback, syntheticWardrobe } from './synthetic-wardrobe';

describe('syntheticWardrobe', () => {
  it('is deterministic for a seed', () => {
    expect(syntheticWardrobe(50, 1)).toEqual(syntheticWardrobe(50, 1));
    expect(syntheticWardrobe(50, 1)).not.toEqual(syntheticWardrobe(50, 2));
  });

  it('builds a varied wardrobe of the requested size', () => {
    const wardrobe = syntheticWardrobe(300);
    expect(wardrobe).toHaveLength(300);
    expect(new Set(wardrobe.map((item) => item.category)).size).toBe(9);
    expect(new Set(wardrobe.map((item) => item.id)).size).toBe(300);
  });
});

describe('Outfit engine on a 1000-piece wardrobe', () => {
  it('still proposes 5 distinct looks, well under a second', () => {
    const wardrobe = syntheticWardrobe(1000);
    const engine = new OutfitGeneratorService();
    const start = performance.now();

    const looks = engine.generate(wardrobe, {
      context: {
        temperature: 16,
        condition: 'cloudy',
        precipitation: 0,
        windSpeed: 10,
        style: null,
        occasion: null,
        profile: styleProfileSchema.parse({}),
        today: new Date('2026-10-01T08:00:00.000Z'),
        feedback: syntheticFeedback(wardrobe),
      },
    });

    // Measured around 0.1 s (npm run profile:generation); generous bound for CI.
    expect(performance.now() - start).toBeLessThan(2000);
    expect(looks).toHaveLength(5);
    expect(new Set(looks.map((look) => look.key)).size).toBe(5);
  });
});
