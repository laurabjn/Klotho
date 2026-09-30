import { styleProfileSchema } from '@klotho/shared';

import { context, look, piece, TODAY } from '../../../testing/outfit-fakes';
import { scoreColor } from './color.scorer';
import { scoreCompatibility } from './compatibility.scorer';
import { scoreOccasion } from './occasion.scorer';
import { DEFAULT_WEIGHTS, scoreOutfit } from './outfit-score';
import { scorePreference } from './preference.scorer';
import { scoreStyle } from './style.scorer';
import { scoreUsage } from './usage.scorer';
import { scoreWeather } from './weather.scorer';

const DAY = 24 * 60 * 60 * 1000;
const top = (o = {}) => piece({ category: 'TOP', ...o });
const bottom = (o = {}) => piece({ category: 'BOTTOM', ...o });
const shoes = (o = {}) => piece({ category: 'SHOES', ...o });
const profile = (o = {}) => styleProfileSchema.parse(o);

describe('WeatherScorer', () => {
  it('wants a layer when it is cool, not when it is hot', () => {
    const base = [top(), bottom(), shoes()];
    const withLayer = look(...base, piece({ category: 'LAYER' }));

    expect(
      scoreWeather(look(...base), context({ temperature: 10 })),
    ).toBeCloseTo(0.5);
    expect(scoreWeather(withLayer, context({ temperature: 10 }))).toBe(1);
    expect(scoreWeather(withLayer, context({ temperature: 28 }))).toBeCloseTo(
      0.6,
    );
  });

  it('a warm sweater can replace the layer', () => {
    const outfit = look(top({ subcategory: 'sweater' }), bottom(), shoes());

    expect(scoreWeather(outfit, context({ temperature: 10 }))).toBe(1);
  });
});

describe('ColorScorer', () => {
  it('likes neutrals with one colour, less so many colours', () => {
    const neutral = look(
      top({ primaryColor: 'white' }),
      bottom({ primaryColor: 'denim' }),
      shoes({ primaryColor: 'black' }),
    );
    const busy = look(
      top({ primaryColor: 'red' }),
      bottom({ primaryColor: 'emerald' }),
      shoes({ primaryColor: 'mustard', secondaryColors: ['purple'] }),
    );

    expect(scoreColor(neutral)).toBe(1);
    expect(scoreColor(busy)).toBe(0.25);
  });

  it('allows one patterned piece', () => {
    const two = look(
      top({ pattern: 'floral' }),
      bottom({ pattern: 'striped' }),
      shoes(),
    );

    expect(
      scoreColor(look(top({ pattern: 'floral' }), bottom(), shoes())),
    ).toBe(0.9);
    expect(scoreColor(two)).toBeCloseTo(0.54);
  });
});

describe('StyleScorer', () => {
  const outfit = look(
    top({ styles: ['romantic'] }),
    bottom({ styles: ['casual'] }),
    shoes(),
  );

  it('measures the share of pieces of the requested style', () => {
    expect(scoreStyle(outfit, context({ style: 'romantic' }))).toBeCloseTo(
      0.2 + 0.8 / 3,
    );
  });

  it('falls back on the favourite styles, else neutral', () => {
    expect(
      scoreStyle(
        outfit,
        context({
          profile: profile({ preferredStyles: ['romantic', 'casual'] }),
        }),
      ),
    ).toBeCloseTo(0.2 + (0.8 * 2) / 3);
    expect(scoreStyle(outfit, context())).toBe(0.5);
  });
});

describe('OccasionScorer', () => {
  it('compares the formality with the occasion', () => {
    const smart = look(
      top({ formalityLevel: 5 }),
      bottom({ formalityLevel: 5 }),
      shoes({ formalityLevel: 5 }),
    );

    expect(scoreOccasion(smart, context({ occasion: 'ceremony' }))).toBe(1);
    expect(scoreOccasion(smart, context({ occasion: 'walk' }))).toBeCloseTo(
      1 - 3.5 / 4,
    );
    expect(scoreOccasion(smart, context())).toBe(0.75);
  });
});

describe('CompatibilityScorer', () => {
  it('rewards similar formality and a shared style', () => {
    const coherent = look(
      top({ formalityLevel: 3, styles: ['chic'] }),
      bottom({ formalityLevel: 4, styles: ['chic', 'classic'] }),
      shoes({ formalityLevel: 3, styles: ['chic'] }),
    );
    const clash = look(
      top({ formalityLevel: 1, styles: ['sporty'] }),
      bottom({ formalityLevel: 5, styles: ['evening'] }),
      shoes({ formalityLevel: 5, styles: ['evening'] }),
    );

    expect(scoreCompatibility(coherent)).toBe(1);
    expect(scoreCompatibility(clash)).toBeLessThan(0.4);
  });
});

describe('PreferenceScorer', () => {
  it('follows favourite and avoided colours', () => {
    const outfit = look(top({ primaryColor: 'powderPink' }), bottom(), shoes());

    expect(
      scorePreference(
        outfit,
        context({ profile: profile({ preferredColors: ['powderPink'] }) }),
      ),
    ).toBeCloseTo(0.6);
    expect(
      scorePreference(
        outfit,
        context({ profile: profile({ avoidedColors: ['powderPink'] }) }),
      ),
    ).toBeCloseTo(0.25);
  });

  it('knows heels, skirts and metals', () => {
    const outfit = look(
      top(),
      bottom({ subcategory: 'midiSkirt' }),
      shoes({ subcategory: 'pumps' }),
      piece({ category: 'JEWELRY', primaryColor: 'gold' }),
    );
    const tastes = profile({
      acceptsHeels: false,
      preferredBottoms: ['skirts'],
      preferredMetals: ['gold'],
    });

    expect(scorePreference(outfit, context({ profile: tastes }))).toBeCloseTo(
      0.5 - 0.3 + 0.1 + 0.15,
    );
  });
});

describe('UsageScorer', () => {
  it('penalises recent wear less and less as days pass', () => {
    const wornDaysAgo = (days: number) =>
      look(top({ lastWornAt: new Date(TODAY.getTime() - days * DAY) }));

    expect(scoreUsage(wornDaysAgo(1), context())).toBeLessThan(
      scoreUsage(wornDaysAgo(7), context()),
    );
    expect(scoreUsage(wornDaysAgo(7), context())).toBeLessThan(
      scoreUsage(wornDaysAgo(20), context()),
    );
    expect(scoreUsage(wornDaysAgo(20), context())).toBe(0.5);
  });

  it('caps the bonus of never worn pieces', () => {
    const allNew = look(
      top({ wearCount: 0, lastWornAt: null }),
      bottom({ wearCount: 0, lastWornAt: null }),
      shoes({ wearCount: 0, lastWornAt: null }),
    );

    expect(scoreUsage(allNew, context())).toBe(0.65);
  });
});

describe('scoreOutfit', () => {
  it('weights the sub-scores, out of 100', () => {
    const outfit = look(top(), bottom(), shoes());
    const { score, breakdown } = scoreOutfit(outfit, context());
    const expected = (
      Object.keys(breakdown) as (keyof typeof breakdown)[]
    ).reduce((sum, name) => sum + DEFAULT_WEIGHTS[name] * breakdown[name], 0);

    expect(score).toBeCloseTo(expected);
    expect(score).toBeLessThanOrEqual(98);
  });
});
