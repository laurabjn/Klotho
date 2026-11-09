import {
  COLOR_FAMILIES,
  HAIRSTYLES,
  LOOK_SUGGESTIONS_MAX,
  MAKEUP_LOOKS,
  type ColorFamily,
  type ColorKey,
  type CompleteLook,
  type LookReason,
  type LookSuggestion,
  type Style,
  type WeatherCondition,
} from '@klotho/shared';

import {
  mainPieces,
  type Outfit,
  type OutfitContext,
} from '../outfits/entities/outfit-candidate';
import { OCCASION_FORMALITY } from '../outfits/scoring/occasion.scorer';
import {
  HAIRSTYLE_TRAITS,
  MAKEUP_TRAITS,
  type HairstyleTraits,
  type MakeupTraits,
  type Tone,
} from './look-catalog';

/** Hair that does not stay in place suffers in these. */
const WET: readonly WeatherCondition[] = ['rain', 'storm', 'snow', 'fog'];
/** °C from which tied hair and light makeup are welcome. */
const HOT_FROM = 25;
/** °C up to which hair worn down keeps the neck warm. */
const COLD_UP_TO = 8;
/** A look with nothing to go on: between casual and dressy. */
const DEFAULT_FORMALITY = 2.5;

type Weather = 'wet' | 'hot' | 'cold' | null;

function weatherOf({ condition, temperature }: OutfitContext): Weather {
  if (condition && WET.includes(condition)) return 'wet';
  if (temperature !== null && temperature >= HOT_FROM) return 'hot';
  if (temperature !== null && temperature <= COLD_UP_TO) return 'cold';
  return null;
}

/** The formality the look calls for: its occasion, else its pieces. */
function targetFormality(outfit: Outfit, context: OutfitContext): number {
  if (context.occasion) return OCCASION_FORMALITY[context.occasion];
  const levels = mainPieces(outfit)
    .map(({ item }) => item.formalityLevel)
    .filter((level): level is number => level !== null);
  if (levels.length > 0)
    return levels.reduce((sum, level) => sum + level, 0) / levels.length;
  return context.profile.preferredFormality ?? DEFAULT_FORMALITY;
}

function formalityFit([min, max]: readonly [number, number], target: number) {
  if (target >= min && target <= max) return 1;
  return 1 - Math.min(Math.abs(target - min), Math.abs(target - max)) / 4;
}

/** The look's own style counts most, then the user's, then the pieces'. */
function styleFit(
  styles: readonly Style[],
  outfit: Outfit,
  context: OutfitContext,
): { score: number; matched: boolean } {
  if (context.style && styles.includes(context.style))
    return { score: 1, matched: true };
  if (context.profile.preferredStyles.some((style) => styles.includes(style)))
    return { score: 0.7, matched: true };
  const worn = new Set(mainPieces(outfit).flatMap(({ item }) => item.styles));
  return {
    score: styles.some((style) => worn.has(style)) ? 0.5 : 0,
    matched: false,
  };
}

const familyOf = (color: ColorKey): ColorFamily =>
  (Object.keys(COLOR_FAMILIES) as ColorFamily[]).find(
    (family) => color in COLOR_FAMILIES[family],
  )!;

const WARM_KEYS: readonly ColorKey[] = ['coral', 'olive', 'khaki', 'gold'];
const COOL_KEYS: readonly ColorKey[] = [
  'powderPink',
  'oldRose',
  'fuchsia',
  'raspberry',
  'burgundy',
  'mint',
  'sage',
  'emerald',
  'forestGreen',
  'silver',
];

function toneOfColor(color: ColorKey): Tone {
  if (WARM_KEYS.includes(color)) return 'warm';
  if (COOL_KEYS.includes(color)) return 'cool';
  const family = familyOf(color);
  if (family === 'warm' || family === 'browns') return 'warm';
  if (family === 'blues' || family === 'purples') return 'cool';
  return 'neutral';
}

/** The user's colour season first (it is about her face), else the outfit. */
function toneOf(outfit: Outfit, context: OutfitContext): Tone {
  const season = context.profile.colorSeason;
  if (season === 'spring' || season === 'autumn') return 'warm';
  if (season === 'summer' || season === 'winter') return 'cool';
  const tones = mainPieces(outfit).map(({ item }) =>
    toneOfColor(item.primaryColor),
  );
  const warm = tones.filter((tone) => tone === 'warm').length;
  const cool = tones.filter((tone) => tone === 'cool').length;
  if (warm === cool) return 'neutral';
  return warm > cool ? 'warm' : 'cool';
}

/** Stable per look, so that two looks do not always get the same idea. */
function tieBreak(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

interface Scored<K extends string> {
  key: K;
  score: number;
  reasons: LookReason[];
}

const best = <K extends string>(scored: Scored<K>[]): LookSuggestion<K>[] =>
  [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, LOOK_SUGGESTIONS_MAX)
    .map(({ key, reasons }) => ({ key, reasons: reasons.slice(0, 2) }));

function scoreHairstyle(
  traits: HairstyleTraits,
  outfit: Outfit,
  context: OutfitContext,
  weather: Weather,
  target: number,
): { score: number; reasons: LookReason[] } {
  const reasons: LookReason[] = [];
  let weatherScore = 0.8;
  if (weather === 'wet' || weather === 'hot') {
    weatherScore = traits.holds ? 1 : weather === 'wet' ? 0.3 : 0.5;
    if (traits.holds) reasons.push(weather);
  } else if (weather === 'cold') {
    weatherScore = traits.holds ? 0.6 : 1;
    if (!traits.holds) reasons.push('cold');
  }
  const formality = formalityFit(traits.formality, target);
  if (context.occasion && formality === 1) reasons.push('occasion');
  const style = styleFit(traits.styles, outfit, context);
  if (style.matched) reasons.push('style');
  // Made for her texture (curls): a real plus, said as such.
  const texture = context.profile.hairTexture;
  const madeFor = !!texture && !!traits.textures?.includes(texture);
  if (madeFor) reasons.push('hair');
  return {
    score:
      0.4 * style.score +
      0.3 * formality +
      0.2 * weatherScore +
      0.1 * (madeFor ? 1 : 0.7),
    reasons,
  };
}

function scoreMakeup(
  traits: MakeupTraits,
  outfit: Outfit,
  context: OutfitContext,
  weather: Weather,
  target: number,
  tone: Tone,
): { score: number; reasons: LookReason[] } {
  const reasons: LookReason[] = [];
  let weatherScore = 0.8;
  if (weather === 'wet') {
    weatherScore = traits.holds ? 1 : traits.intensity === 3 ? 0.4 : 0.7;
    if (traits.holds) reasons.push('wet');
  } else if (weather === 'hot') {
    weatherScore = [1, 0.7, 0.4][traits.intensity - 1]!;
    if (traits.intensity === 1) reasons.push('hot');
  }
  const formality = formalityFit(traits.formality, target);
  if (context.occasion && formality === 1) reasons.push('occasion');
  const style = styleFit(traits.styles, outfit, context);
  if (style.matched) reasons.push('style');
  const lovesColour = context.profile.makeupPreference === 'colorful';
  let colors = 0.7;
  if (traits.echoes) {
    // A colourful look needs a reason: a colour of the outfit, or her taste.
    const echoed = mainPieces(outfit).some(({ item }) =>
      [item.primaryColor, ...item.secondaryColors].some((color) =>
        traits.echoes!.includes(familyOf(color)),
      ),
    );
    colors = echoed ? 1 : lovesColour ? 0.7 : 0.3;
    if (echoed) reasons.push('echo');
  } else if (tone !== 'neutral' && traits.tone !== 'neutral') {
    colors = traits.tone === tone ? 1 : 0.4;
    if (traits.tone === tone) reasons.push('colors');
  }
  return {
    score:
      0.4 * style.score +
      0.3 * formality +
      0.15 * weatherScore +
      0.15 * colors +
      (lovesColour && traits.echoes ? 0.25 : 0),
    reasons,
  };
}

/**
 * "Le look complet": the hairstyles and makeup looks that best suit a look,
 * its weather and occasion, and what the user told about her hair and her
 * taste for makeup. Pure rules, no AI.
 */
export function suggestCompleteLook(
  outfitId: string,
  outfit: Outfit,
  context: OutfitContext,
): CompleteLook {
  const { hairLength, hairTexture, makeupPreference } = context.profile;
  const weather = weatherOf(context);
  const target = targetFormality(outfit, context);
  const tone = toneOf(outfit, context);
  const tie = (key: string) => 0.02 * tieBreak(`${outfitId}:${key}`);

  const hairstyles = HAIRSTYLES.filter((key) => {
    const traits = HAIRSTYLE_TRAITS[key];
    if (hairLength && !traits.lengths.includes(hairLength)) return false;
    return (
      !hairTexture || !traits.textures || traits.textures.includes(hairTexture)
    );
  }).map((key) => {
    const { score, reasons } = scoreHairstyle(
      HAIRSTYLE_TRAITS[key],
      outfit,
      context,
      weather,
      target,
    );
    return { key, score: score + tie(key), reasons };
  });

  const makeups =
    makeupPreference === 'none'
      ? []
      : MAKEUP_LOOKS.filter(
          (key) =>
            makeupPreference !== 'light' || MAKEUP_TRAITS[key].intensity === 1,
        ).map((key) => {
          const { score, reasons } = scoreMakeup(
            MAKEUP_TRAITS[key],
            outfit,
            context,
            weather,
            target,
            tone,
          );
          return { key, score: score + tie(key), reasons };
        });

  return { hairstyles: best(hairstyles), makeups: best(makeups) };
}
