import {
  HAIRSTYLES,
  LOOK_SUGGESTIONS_MAX,
  MAKEUP_LOOKS,
  styleProfileSchema,
} from '@klotho/shared';

import { context, look, piece } from '../../testing/outfit-fakes';
import { HAIRSTYLE_TRAITS, MAKEUP_TRAITS } from './look-catalog';
import { suggestCompleteLook } from './look-suggester';

const outfit = (o = {}) =>
  look(
    piece({ category: 'TOP', ...o }),
    piece({ category: 'BOTTOM', ...o }),
    piece({ category: 'SHOES' }),
  );
const profile = (o = {}) => styleProfileSchema.parse(o);

describe('suggestCompleteLook', () => {
  it('offers two hairstyles and two makeup looks, with their reasons', () => {
    const result = suggestCompleteLook('look-1', outfit(), context());

    expect(result.hairstyles).toHaveLength(LOOK_SUGGESTIONS_MAX);
    expect(result.makeups).toHaveLength(LOOK_SUGGESTIONS_MAX);
    expect(result.hairstyles[0]!.key).not.toBe(result.hairstyles[1]!.key);
    for (const suggestion of [...result.hairstyles, ...result.makeups])
      expect(suggestion.reasons.length).toBeLessThanOrEqual(2);
  });

  it('ties the hair up under the rain', () => {
    const result = suggestCompleteLook(
      'look-1',
      outfit(),
      context({ condition: 'rain', temperature: 12 }),
    );

    for (const { key, reasons } of result.hairstyles) {
      expect(HAIRSTYLE_TRAITS[key].holds).toBe(true);
      expect(reasons[0]).toBe('wet');
    }
  });

  it('dresses the hair up for a ceremony and keeps it simple for a walk', () => {
    const ceremony = suggestCompleteLook(
      'look-1',
      outfit(),
      context({ occasion: 'ceremony' }),
    );
    const walk = suggestCompleteLook(
      'look-1',
      outfit(),
      context({ occasion: 'walk' }),
    );

    for (const { key } of ceremony.hairstyles)
      expect(HAIRSTYLE_TRAITS[key].formality[1]).toBe(5);
    for (const { key } of walk.hairstyles)
      expect(HAIRSTYLE_TRAITS[key].formality[0]).toBe(1);
  });

  it('follows the style of the look', () => {
    const result = suggestCompleteLook(
      'look-1',
      outfit(),
      context({ style: 'victorian', occasion: 'evening' }),
    );

    expect(HAIRSTYLE_TRAITS[result.hairstyles[0]!.key].styles).toContain(
      'victorian',
    );
    expect(result.makeups[0]!.key).toBe('victorianPale');
    expect(result.makeups[0]!.reasons).toContain('style');
  });

  it('only suggests hairstyles that suit her hair', () => {
    const short = profile({ hairLength: 'short', hairTexture: 'coily' });
    const result = suggestCompleteLook(
      'look-1',
      outfit(),
      context({ profile: short }),
    );

    for (const { key } of result.hairstyles) {
      const traits = HAIRSTYLE_TRAITS[key];
      expect(traits.lengths).toContain('short');
      expect(traits.textures ?? ['coily']).toContain('coily');
    }
    // Every length and texture keeps something to suggest.
    for (const hairLength of ['short', 'medium', 'long'] as const)
      for (const hairTexture of ['straight', 'wavy', 'curly', 'coily'] as const)
        expect(
          suggestCompleteLook(
            'look-1',
            outfit(),
            context({ profile: profile({ hairLength, hairTexture }) }),
          ).hairstyles,
        ).toHaveLength(LOOK_SUGGESTIONS_MAX);
  });

  it('says when a hairstyle is made for her curls', () => {
    const result = suggestCompleteLook(
      'look-1',
      outfit(),
      context({ profile: profile({ hairTexture: 'curly' }) }),
    );

    expect(result.hairstyles[0]).toEqual({
      key: 'definedCurls',
      reasons: ['hair'],
    });
  });

  it('respects her taste for makeup', () => {
    const none = suggestCompleteLook(
      'look-1',
      outfit(),
      context({ profile: profile({ makeupPreference: 'none' }) }),
    );
    const light = suggestCompleteLook(
      'look-1',
      outfit(),
      context({
        occasion: 'evening',
        profile: profile({ makeupPreference: 'light' }),
      }),
    );

    expect(none.makeups).toEqual([]);
    expect(none.hairstyles).toHaveLength(LOOK_SUGGESTIONS_MAX);
    for (const { key } of light.makeups)
      expect(MAKEUP_TRAITS[key].intensity).toBe(1);
  });

  it('matches the makeup to her colour season, else to the outfit', () => {
    const warmSeason = suggestCompleteLook(
      'look-1',
      outfit(),
      context({ profile: profile({ colorSeason: 'autumn' }) }),
    );
    const coolOutfit = suggestCompleteLook(
      'look-1',
      outfit({ primaryColor: 'navy' }),
      context(),
    );

    expect(MAKEUP_TRAITS[warmSeason.makeups[0]!.key].tone).toBe('warm');
    expect(warmSeason.makeups[0]!.reasons).toContain('colors');
    expect(MAKEUP_TRAITS[coolOutfit.makeups[0]!.key].tone).toBe('cool');
  });

  it('keeps the makeup light in the heat', () => {
    const result = suggestCompleteLook(
      'look-1',
      outfit(),
      context({ temperature: 30 }),
    );

    expect(MAKEUP_TRAITS[result.makeups[0]!.key].intensity).toBe(1);
    expect(result.makeups[0]!.reasons[0]).toBe('hot');
  });

  it('gives the same answer for the same look, and varies between looks', () => {
    const first = suggestCompleteLook('look-1', outfit(), context());
    const keys = new Set(
      Array.from(
        { length: 20 },
        (_, i) =>
          suggestCompleteLook(`look-${i}`, outfit(), context()).hairstyles[0]!
            .key,
      ),
    );

    expect(suggestCompleteLook('look-1', outfit(), context())).toEqual(first);
    expect(keys.size).toBeGreaterThan(1);
  });

  it('describes every hairstyle and makeup look of the catalogue', () => {
    expect(Object.keys(HAIRSTYLE_TRAITS).sort()).toEqual(
      [...HAIRSTYLES].sort(),
    );
    expect(Object.keys(MAKEUP_TRAITS).sort()).toEqual([...MAKEUP_LOOKS].sort());
  });
});
