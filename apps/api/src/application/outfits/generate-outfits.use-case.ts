import {
  styleProfileSchema,
  type Occasion,
  type Style,
  type WeatherCondition,
} from '@klotho/shared';

import type { StyleProfileRepository } from '../../domain/preferences/ports/style-profile.repository';
import type { Clock } from '../../domain/shared/ports/clock';
import type { OutfitExclusions } from '../../domain/outfits/services/outfit-candidate-filter';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import type {
  GeneratedOutfit,
  OutfitGeneratorService,
} from './outfit-generator.service';

/** What the user asks for (the form of Sprint 7). */
export interface GenerateOutfitsCommand {
  style: Style | null;
  occasion: Occasion | null;
  /** °C: the manual temperature, or the weather's; null when unknown. */
  temperature: number | null;
  condition?: WeatherCondition | null;
  precipitation?: number;
  windSpeed?: number;
  imposedItemIds?: string[];
  exclusions?: OutfitExclusions;
  excludedOutfitKeys?: string[];
  count?: number;
}

/** Loads the wardrobe and the style profile, then runs the outfit engine. */
export class GenerateOutfitsUseCase {
  constructor(
    private readonly wardrobe: WardrobeRepository,
    private readonly profiles: StyleProfileRepository,
    private readonly generator: OutfitGeneratorService,
    private readonly clock: Clock,
  ) {}

  async execute(
    userId: string,
    command: GenerateOutfitsCommand,
  ): Promise<GeneratedOutfit[]> {
    const [items, stored] = await Promise.all([
      this.wardrobe.findAllOwned(userId),
      this.profiles.findByUser(userId),
    ]);
    // Without a profile (onboarding skipped), no taste is assumed.
    const profile = stored ?? styleProfileSchema.parse({});

    return this.generator.generate(items, {
      context: {
        temperature: command.temperature,
        condition: command.condition ?? null,
        precipitation: command.precipitation ?? 0,
        windSpeed: command.windSpeed ?? 0,
        style: command.style,
        occasion: command.occasion,
        profile,
        today: this.clock.now(),
      },
      imposedItemIds: command.imposedItemIds ?? [],
      exclusions: command.exclusions,
      excludedOutfitKeys: command.excludedOutfitKeys,
      count: command.count,
    });
  }
}
