import { OUTFITS_PER_GENERATION } from '@klotho/shared';

import {
  outfitKey,
  type Outfit,
  type OutfitCandidate,
  type OutfitContext,
  type OutfitRole,
} from '../../domain/outfits/entities/outfit-candidate';
import { pieceWeatherFit } from '../../domain/outfits/rules/weather-rules';
import {
  DEFAULT_WEIGHTS,
  scoreOutfit,
  type ScoreBreakdown,
  type ScoreWeights,
  type ScoredOutfit,
} from '../../domain/outfits/scoring/outfit-score';
import {
  filterCandidates,
  NO_EXCLUSIONS,
  type OutfitExclusions,
} from '../../domain/outfits/services/outfit-candidate-filter';
import {
  buildCombinations,
  FINISHING_ROLES,
  groupByRole,
} from '../../domain/outfits/services/outfit-combination-builder';
import { selectDiverse } from '../../domain/outfits/services/outfit-diversity.service';

export interface OutfitEngineSettings {
  weights: ScoreWeights;
  /** Minimal distance between two proposed looks (0 to 1). */
  minDistance: number;
  maxPerBase: number;
  /** Best pieces kept per role before combining (bounds the work). */
  maxPerRole: number;
}

export const DEFAULT_ENGINE_SETTINGS: OutfitEngineSettings = {
  weights: DEFAULT_WEIGHTS,
  minDistance: 0.5,
  maxPerBase: 2,
  maxPerRole: 10,
};

export const OUTFIT_ENGINE_SETTINGS = Symbol('OutfitEngineSettings');

/** Points (out of 100) a finishing piece may cost before it is left out. */
const FINISHING_TOLERANCE = 0.5;

export interface OutfitGenerationRequest {
  context: OutfitContext;
  imposedItemId?: string | null;
  exclusions?: OutfitExclusions;
  /** Keys of looks already proposed, not proposed again. */
  excludedOutfitKeys?: string[];
  count?: number;
}

export interface GeneratedOutfit {
  key: string;
  pieces: { role: OutfitRole; itemId: string }[];
  /** Out of 100. */
  score: number;
  breakdown: ScoreBreakdown;
}

/** Receives each proposed look with its detailed score (debug logging). */
export type ScoreLogger = (outfit: GeneratedOutfit) => void;

/**
 * The deterministic outfit engine (Sprint 6), without any external AI:
 * filter the wardrobe, build valid silhouettes, score them, keep a diverse
 * top N, then finish each look with a bag, a jewel or an accessory when it
 * makes it better.
 */
export class OutfitGeneratorService {
  constructor(
    private readonly settings: OutfitEngineSettings = DEFAULT_ENGINE_SETTINGS,
    private readonly logScore?: ScoreLogger,
  ) {}

  generate(
    wardrobe: OutfitCandidate[],
    request: OutfitGenerationRequest,
  ): GeneratedOutfit[] {
    const { context } = request;
    const { weights } = this.settings;
    const { candidates, imposed } = filterCandidates(
      wardrobe,
      context,
      request.exclusions ?? NO_EXCLUSIONS,
      request.imposedItemId ?? null,
    );

    const combinations = buildCombinations(candidates, imposed, {
      maxPerRole: this.settings.maxPerRole,
      rank: (item) => pieceWeatherFit(item, context),
    });
    const scored = combinations
      .map((outfit) => scoreOutfit(outfit, context, weights))
      .sort((a, b) => b.score - a.score);

    const selected = selectDiverse(scored, {
      count: request.count ?? OUTFITS_PER_GENERATION,
      minDistance: this.settings.minDistance,
      maxPerBase: this.settings.maxPerBase,
      varietyWeight: weights.variety,
      excludedKeys: request.excludedOutfitKeys ?? [],
    });

    const finishing = groupByRole(candidates);
    // Best first: the diversity pass picks in another order.
    const results = selected
      .map((entry) => this.finish(entry, finishing, context))
      .sort((a, b) => b.score - a.score)
      .map((entry) => this.toResult(entry));
    results.forEach((result) => this.logScore?.(result));
    return results;
  }

  /**
   * Adds the best bag, jewel and accessory, as long as they do not make the
   * look worse (an avoided colour, a beanie in summer…).
   */
  private finish(
    entry: ScoredOutfit,
    byRole: Map<OutfitRole, OutfitCandidate[]>,
    context: OutfitContext,
  ): ScoredOutfit {
    let best = entry;
    for (const role of FINISHING_ROLES) {
      if (best.outfit.pieces.some((piece) => piece.role === role)) continue;
      let bestForRole: ScoredOutfit | null = null;
      for (const item of byRole.get(role) ?? []) {
        const outfit: Outfit = {
          pieces: [...best.outfit.pieces, { role, item }],
        };
        const candidate = scoreOutfit(outfit, context, this.settings.weights);
        if (!bestForRole || candidate.score > bestForRole.score)
          bestForRole = candidate;
      }
      if (bestForRole && bestForRole.score >= best.score - FINISHING_TOLERANCE)
        best = bestForRole;
    }
    return best;
  }

  private toResult({
    outfit,
    score,
    breakdown,
  }: ScoredOutfit): GeneratedOutfit {
    return {
      key: outfitKey(outfit),
      pieces: outfit.pieces.map((piece) => ({
        role: piece.role,
        itemId: piece.item.id,
      })),
      score: Math.round(score * 10) / 10,
      breakdown,
    };
  }
}
