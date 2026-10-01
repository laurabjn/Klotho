import {
  ImposedItemNotFoundError,
  ImposedItemUnavailableError,
} from '../../domain/outfits/errors';
import { outfitDistance } from '../../domain/outfits/services/outfit-diversity.service';
import { DEFAULT_WEIGHTS } from '../../domain/outfits/scoring/outfit-score';
import { context, look, piece, TODAY } from '../../testing/outfit-fakes';
import type { OutfitCandidate } from '../../domain/outfits/entities/outfit-candidate';
import {
  DEFAULT_ENGINE_SETTINGS,
  OutfitGeneratorService,
  type GeneratedOutfit,
} from './outfit-generator.service';

const DAY = 24 * 60 * 60 * 1000;

/** A varied wardrobe: 4 tops, 3 bottoms, 2 dresses, 3 shoes, 2 layers, extras. */
function wardrobe(): OutfitCandidate[] {
  return [
    piece({
      category: 'TOP',
      subcategory: 'blouse',
      primaryColor: 'powderPink',
      styles: ['romantic'],
    }),
    piece({
      category: 'TOP',
      subcategory: 'tshirt',
      primaryColor: 'white',
      styles: ['casual'],
    }),
    piece({
      category: 'TOP',
      subcategory: 'shirt',
      primaryColor: 'skyBlue',
      styles: ['chic'],
    }),
    piece({
      category: 'TOP',
      subcategory: 'sweater',
      primaryColor: 'sand',
      styles: ['casual'],
    }),
    piece({
      category: 'BOTTOM',
      subcategory: 'jeans',
      primaryColor: 'denim',
      styles: ['casual'],
    }),
    piece({
      category: 'BOTTOM',
      subcategory: 'midiSkirt',
      primaryColor: 'oldRose',
      styles: ['romantic'],
    }),
    piece({
      category: 'BOTTOM',
      subcategory: 'trousers',
      primaryColor: 'black',
      styles: ['chic'],
    }),
    piece({
      category: 'DRESS',
      subcategory: 'midiDress',
      primaryColor: 'nudePink',
      styles: ['romantic'],
    }),
    piece({
      category: 'DRESS',
      subcategory: 'casualDress',
      primaryColor: 'sage',
      styles: ['boho'],
    }),
    piece({
      category: 'SHOES',
      subcategory: 'sneakers',
      primaryColor: 'white',
      styles: ['casual'],
    }),
    piece({
      category: 'SHOES',
      subcategory: 'flats',
      primaryColor: 'nudePink',
      styles: ['romantic'],
    }),
    piece({
      category: 'SHOES',
      subcategory: 'loafers',
      primaryColor: 'chocolate',
      styles: ['chic'],
    }),
    piece({
      category: 'LAYER',
      subcategory: 'blazer',
      primaryColor: 'sand',
      styles: ['chic'],
    }),
    piece({
      category: 'LAYER',
      subcategory: 'cardigan',
      primaryColor: 'ecru',
      styles: ['romantic'],
    }),
    piece({ category: 'BAG', subcategory: 'handbag', primaryColor: 'taupe' }),
    piece({
      category: 'JEWELRY',
      subcategory: 'earrings',
      primaryColor: 'gold',
    }),
  ];
}

const engine = new OutfitGeneratorService();
const ids = (outfit: GeneratedOutfit) => outfit.pieces.map((p) => p.itemId);
const roles = (outfit: GeneratedOutfit) => outfit.pieces.map((p) => p.role);

describe('OutfitGeneratorService (Sprint 6 TDD table)', () => {
  it('30°C: the puffer jacket is excluded', () => {
    const puffer = piece({ category: 'LAYER', subcategory: 'puffer' });
    const result = engine.generate([...wardrobe(), puffer], {
      context: context({ temperature: 30 }),
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.flatMap(ids)).not.toContain(puffer.id);
  });

  it('4°C with sandals only: no look is proposed', () => {
    const items = [
      piece({ category: 'TOP', subcategory: 'sweater' }),
      piece({ category: 'BOTTOM', subcategory: 'jeans' }),
      piece({ category: 'SHOES', subcategory: 'sandals' }),
    ];

    expect(
      engine.generate(items, { context: context({ temperature: 4 }) }),
    ).toEqual([]);
  });

  it('a piece in the wash is never a candidate', () => {
    const washing = piece({
      category: 'TOP',
      status: 'WASHING',
      styles: ['romantic'],
    });
    const result = engine.generate([...wardrobe(), washing], {
      context: context({ style: 'romantic' }),
    });

    expect(result.flatMap(ids)).not.toContain(washing.id);
  });

  it('an imposed piece is in every look', () => {
    const items = wardrobe();
    const skirt = items.find((i) => i.subcategory === 'midiSkirt')!;
    const result = engine.generate(items, {
      context: context(),
      imposedItemIds: [skirt.id],
    });

    expect(result).toHaveLength(5);
    for (const outfit of result) expect(ids(outfit)).toContain(skirt.id);
  });

  it('a romantic request favours romantic pieces', () => {
    const items = wardrobe();
    const [best] = engine.generate(items, {
      context: context({ style: 'romantic' }),
    });
    const romantic = new Set(
      items.filter((i) => i.styles.includes('romantic')).map((i) => i.id),
    );

    expect(best!.breakdown.style).toBeGreaterThan(0.8);
    expect(
      ids(best!).filter((id) => romantic.has(id)).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('5 looks, far enough from each other', () => {
    const items = wardrobe();
    const result = engine.generate(items, { context: context() });
    // Rebuild the looks to measure their distance.
    const byId = new Map(items.map((i) => [i.id, i]));
    const looks = result.map((outfit) =>
      look(...outfit.pieces.map((p) => byId.get(p.itemId)!)),
    );

    expect(result).toHaveLength(5);
    for (const [i, a] of looks.entries())
      for (const b of looks.slice(i + 1))
        expect(outfitDistance(a, b)).toBeGreaterThanOrEqual(
          DEFAULT_ENGINE_SETTINGS.minDistance,
        );
  });

  it('worn yesterday: penalised', () => {
    const fresh = piece({
      category: 'TOP',
      subcategory: 'tshirt',
      lastWornAt: new Date(TODAY.getTime() - 30 * DAY),
    });
    const wornYesterday = piece({
      category: 'TOP',
      subcategory: 'tshirt',
      lastWornAt: new Date(TODAY.getTime() - DAY),
    });
    const items = [
      fresh,
      wornYesterday,
      piece({ category: 'BOTTOM', subcategory: 'jeans' }),
      piece({ category: 'SHOES', subcategory: 'sneakers' }),
    ];
    const [first, second] = engine.generate(items, {
      context: context({ temperature: 22 }),
    });

    expect(ids(first!)).toContain(fresh.id);
    expect(ids(second!)).toContain(wornYesterday.id);
    expect(second!.breakdown.usage).toBeLessThan(first!.breakdown.usage);
  });

  it('never worn: a small bonus', () => {
    const neverWorn = piece({
      category: 'TOP',
      wearCount: 0,
      lastWornAt: null,
    });
    const worn = piece({ category: 'TOP' });
    const items = [
      worn,
      neverWorn,
      piece({ category: 'BOTTOM' }),
      piece({ category: 'SHOES' }),
    ];
    const [first, second] = engine.generate(items, {
      context: context({ temperature: 22 }),
    });

    expect(ids(first!)).toContain(neverWorn.id);
    const bonus = first!.breakdown.usage - second!.breakdown.usage;
    expect(bonus).toBeGreaterThan(0);
    expect(bonus).toBeLessThanOrEqual(0.15);
  });
});

describe('OutfitGeneratorService', () => {
  it('only builds valid silhouettes, one piece per main role', () => {
    const result = engine.generate(wardrobe(), {
      context: context({ temperature: 12 }),
    });

    for (const outfit of result) {
      const r = roles(outfit);
      const complete =
        (r.includes('top') && r.includes('bottom') && r.includes('shoes')) ||
        (r.includes('dress') && r.includes('shoes'));
      expect(complete).toBe(true);
      for (const role of ['top', 'bottom', 'dress', 'layer', 'shoes'])
        expect(r.filter((x) => x === role).length).toBeLessThanOrEqual(1);
      expect(r.includes('dress') && r.includes('top')).toBe(false);
    }
  });

  it('adds a layer when it is cool, none when it is hot', () => {
    const cool = engine.generate(wardrobe(), {
      context: context({ temperature: 12 }),
    });
    const hot = engine.generate(wardrobe(), {
      context: context({ temperature: 28 }),
    });

    expect(roles(cool[0]!)).toContain('layer');
    expect(roles(hot[0]!)).not.toContain('layer');
  });

  it('applies the explicit exclusions ("pas de noir", "pas de talons")', () => {
    const pumps = piece({ category: 'SHOES', subcategory: 'pumps' });
    const items = [...wardrobe(), pumps];
    const result = engine.generate(items, {
      context: context(),
      exclusions: {
        itemIds: [],
        categories: [],
        subcategories: ['pumps'],
        colors: ['black'],
      },
    });
    const black = items
      .filter((i) => i.primaryColor === 'black')
      .map((i) => i.id);

    expect(result.flatMap(ids)).not.toContain(pumps.id);
    for (const id of black) expect(result.flatMap(ids)).not.toContain(id);
  });

  it('does not propose again the looks already seen', () => {
    const first = engine.generate(wardrobe(), { context: context() });
    const again = engine.generate(wardrobe(), {
      context: context(),
      excludedOutfitKeys: first.map((o) => o.key),
    });

    expect(again.map((o) => o.key)).not.toEqual(
      expect.arrayContaining([first[0]!.key]),
    );
  });

  it('refuses an imposed piece that is not in the wardrobe, or in the wash', () => {
    const washing = piece({ category: 'DRESS', status: 'WASHING' });

    expect(() =>
      engine.generate(wardrobe(), {
        context: context(),
        imposedItemIds: ['unknown'],
      }),
    ).toThrow(ImposedItemNotFoundError);
    expect(() =>
      engine.generate([...wardrobe(), washing], {
        context: context(),
        imposedItemIds: [washing.id],
      }),
    ).toThrow(ImposedItemUnavailableError);
  });

  it('keeps an imposed piece even when the weather does not suit it', () => {
    const puffer = piece({ category: 'LAYER', subcategory: 'puffer' });
    const result = engine.generate([...wardrobe(), puffer], {
      context: context({ temperature: 30 }),
      imposedItemIds: [puffer.id],
    });

    expect(result.length).toBeGreaterThan(0);
    for (const outfit of result) expect(ids(outfit)).toContain(puffer.id);
    expect(result[0]!.breakdown.weather).toBeLessThan(0.5);
  });

  it('gives a detailed score out of 100 and can log it', () => {
    const logged: GeneratedOutfit[] = [];
    const result = new OutfitGeneratorService(DEFAULT_ENGINE_SETTINGS, (o) =>
      logged.push(o),
    ).generate(wardrobe(), { context: context() });

    expect(logged).toEqual(result);
    for (const outfit of result) {
      expect(outfit.score).toBeGreaterThan(0);
      expect(outfit.score).toBeLessThanOrEqual(100);
      expect(Object.keys(outfit.breakdown).sort()).toEqual([
        'color',
        'compatibility',
        'occasion',
        'preferences',
        'style',
        'usage',
        'weather',
      ]);
    }
  });

  it('uses the configured weights', () => {
    const styleOnly = new OutfitGeneratorService({
      ...DEFAULT_ENGINE_SETTINGS,
      weights: {
        ...Object.fromEntries(Object.keys(DEFAULT_WEIGHTS).map((k) => [k, 0])),
        style: 100,
      } as typeof DEFAULT_WEIGHTS,
    });
    const [best] = styleOnly.generate(wardrobe(), {
      context: context({ style: 'chic' }),
    });

    expect(best!.score).toBeCloseTo(best!.breakdown.style * 100, 1);
  });

  it('finishes the looks with a bag or a jewel when it helps', () => {
    const result = engine.generate(wardrobe(), { context: context() });

    expect(
      result.some((o) => roles(o).some((r) => r === 'bag' || r === 'jewelry')),
    ).toBe(true);
  });
});
