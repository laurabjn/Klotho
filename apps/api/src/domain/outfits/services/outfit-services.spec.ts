import { context, look, piece } from '../../../testing/outfit-fakes';
import { outfitKey } from '../entities/outfit-candidate';
import { scoreOutfit } from '../scoring/outfit-score';
import { filterCandidates } from './outfit-candidate-filter';
import { buildCombinations } from './outfit-combination-builder';
import {
  baseKey,
  outfitDistance,
  selectDiverse,
} from './outfit-diversity.service';

const rankAll = { maxPerRole: 10, rank: () => 1 };

describe('filterCandidates', () => {
  it('keeps available pieces only, never underwear', () => {
    const items = [
      piece({ category: 'TOP' }),
      ...(['WASHING', 'LENT', 'ARCHIVED', 'SOLD', 'DONATED'] as const).map(
        (status) => piece({ category: 'TOP', status }),
      ),
      piece({ category: 'UNDERWEAR' }),
    ];

    expect(filterCandidates(items, context()).candidates).toEqual([items[0]]);
  });
});

describe('buildCombinations', () => {
  it('builds top + bottom + shoes and dress + shoes, with or without a layer', () => {
    const items = [
      piece({ category: 'TOP' }),
      piece({ category: 'BOTTOM' }),
      piece({ category: 'DRESS' }),
      piece({ category: 'SHOES' }),
      piece({ category: 'LAYER' }),
    ];

    const outfits = buildCombinations(items, [], rankAll);

    // (1 top×bottom + 1 dress) × (no layer + 1 layer) × 1 shoes
    expect(outfits).toHaveLength(4);
  });

  it('needs shoes', () => {
    const items = [piece({ category: 'TOP' }), piece({ category: 'BOTTOM' })];

    expect(buildCombinations(items, [], rankAll)).toEqual([]);
  });

  it('puts an imposed dress in every look, and no top then', () => {
    const dress = piece({ category: 'DRESS' });
    const items = [
      piece({ category: 'TOP' }),
      piece({ category: 'BOTTOM' }),
      dress,
      piece({ category: 'DRESS' }),
      piece({ category: 'SHOES' }),
    ];

    const outfits = buildCombinations(items, [dress], rankAll);

    expect(outfits).toHaveLength(1);
    expect(outfits[0]!.pieces.map((p) => p.item)).toContain(dress);
  });

  it('keeps only the best pieces of each role', () => {
    const tops = Array.from({ length: 5 }, (_, i) =>
      piece({ category: 'TOP', formalityLevel: i + 1 }),
    );
    const items = [
      ...tops,
      piece({ category: 'BOTTOM' }),
      piece({ category: 'SHOES' }),
    ];

    const outfits = buildCombinations(items, [], {
      maxPerRole: 2,
      rank: (item) => item.formalityLevel ?? 0,
    });

    expect(outfits.map((o) => o.pieces[0]!.item)).toEqual([tops[4], tops[3]]);
  });
});

describe('selectDiverse', () => {
  const tops = [1, 2, 3].map(() => piece({ category: 'TOP' }));
  const bottoms = [1, 2, 3].map(() => piece({ category: 'BOTTOM' }));
  const shoesA = piece({ category: 'SHOES' });
  const shoesB = piece({ category: 'SHOES' });
  const scored = tops
    .flatMap((top) =>
      bottoms.flatMap((bottom) => [
        look(top, bottom, shoesA),
        look(top, bottom, shoesB),
      ]),
    )
    .map((outfit) => scoreOutfit(outfit, context()));
  const options = {
    count: 3,
    minDistance: 0.5,
    maxPerBase: 1,
    varietyWeight: 2,
    excludedKeys: [],
  };

  it('keeps distant looks, one per base', () => {
    const picked = selectDiverse(scored, options);
    const bases = picked.map((entry) => baseKey(entry.outfit));

    expect(picked).toHaveLength(3);
    expect(new Set(bases).size).toBe(3);
    for (const [i, a] of picked.entries())
      for (const b of picked.slice(i + 1))
        expect(outfitDistance(a.outfit, b.outfit)).toBeGreaterThanOrEqual(0.5);
  });

  it('leaves out the looks already proposed', () => {
    const first = selectDiverse(scored, options);
    const again = selectDiverse(scored, {
      ...options,
      excludedKeys: first.map((entry) => outfitKey(entry.outfit)),
    });

    for (const entry of again)
      expect(first.map((e) => outfitKey(e.outfit))).not.toContain(
        outfitKey(entry.outfit),
      );
  });

  it('relaxes the distance rather than returning fewer looks', () => {
    const tight = selectDiverse(scored, {
      ...options,
      count: 6,
      maxPerBase: 2,
    });

    expect(tight).toHaveLength(6);
  });
});
