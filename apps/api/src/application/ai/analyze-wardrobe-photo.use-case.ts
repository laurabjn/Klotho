import {
  garmentSuggestionSchema,
  type AiCredits,
  type WardrobePhotoAnalysis,
} from '@klotho/shared';

import {
  AiQuotaExceededError,
  AiUnavailableError,
  NoGarmentError,
} from '../../domain/ai/errors';
import type { AiUsageRepository } from '../../domain/ai/ports/ai-usage.repository';
import type { GarmentAnalyzer } from '../../domain/ai/ports/garment-analyzer';
import type { FileStorage } from '../../domain/storage/ports/file-storage';
import type { ImageProcessor } from '../../domain/storage/ports/image-processor';
import { storeWardrobePhoto } from '../wardrobe/photos/upload-wardrobe-photo.use-case';
import type { AiSettings } from './ai-settings';

/** Enough to recognise a piece, about 3 times cheaper than the stored photo. */
const AI_IMAGE_SIDE = 800;

/** Photo analyses left to the user. */
export class GetAiCreditsUseCase {
  constructor(
    private readonly usage: AiUsageRepository,
    private readonly settings: AiSettings,
  ) {}

  async execute(userId: string): Promise<AiCredits> {
    const quota = this.settings.freePhotoAnalyses;
    if (!this.settings.enabled) return { enabled: false, remaining: 0, quota };
    const used = await this.usage.countCharged(userId, 'photoAnalysis');
    return { enabled: true, remaining: Math.max(quota - used, 0), quota };
  }
}

/**
 * "Analyse once, reuse always": the photo is analysed when it is added, the
 * attributes go into the piece, and the outfit engine never calls the AI.
 * The photo is stored like any upload, ready to be attached to the piece.
 */
export class AnalyzeWardrobePhotoUseCase {
  constructor(
    private readonly images: ImageProcessor,
    private readonly storage: FileStorage,
    private readonly analyzer: GarmentAnalyzer,
    private readonly usage: AiUsageRepository,
    private readonly settings: AiSettings,
  ) {}

  async execute(
    userId: string,
    file: Uint8Array,
    language: 'fr' | 'en',
  ): Promise<WardrobePhotoAnalysis> {
    if (!this.settings.enabled) throw new AiUnavailableError();
    const quota = this.settings.freePhotoAnalyses;
    const used = await this.usage.countCharged(userId, 'photoAnalysis');
    if (used >= quota) throw new AiQuotaExceededError();

    const image = await this.images.normalize(file);
    const analysis = await this.analyzer.analyze(
      await this.images.shrink(image, AI_IMAGE_SIDE),
      language,
    );
    // Paid even when no piece is found: recorded, but not charged to the user.
    await this.usage.record({
      userId,
      feature: 'photoAnalysis',
      ...analysis.usage,
      charged: analysis.isGarment,
    });
    if (!analysis.isGarment) throw new NoGarmentError();

    const photo = await storeWardrobePhoto(this.storage, userId, image);
    return {
      photo,
      suggestion: garmentSuggestionSchema.parse(analysis.attributes),
      credits: {
        enabled: true,
        remaining: Math.max(quota - used - 1, 0),
        quota,
      },
    };
  }
}
