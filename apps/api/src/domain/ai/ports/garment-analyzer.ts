import type { ProcessedImage } from '../../storage/ports/image-processor';

/** What one call to the AI cost, for the follow-up per user and feature. */
export interface AiCallUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface GarmentAnalysis {
  /** False when the photo shows no piece of clothing. */
  isGarment: boolean;
  /** Raw answer: checked field by field with garmentSuggestionSchema. */
  attributes: unknown;
  usage: AiCallUsage;
}

/**
 * Recognises a piece of clothing on a photo (Claude today), replaceable.
 * Implementations throw AiUnavailableError on timeout or failure.
 */
export interface GarmentAnalyzer {
  analyze(
    image: ProcessedImage,
    language: 'fr' | 'en',
  ): Promise<GarmentAnalysis>;
}

export const GARMENT_ANALYZER = Symbol('GarmentAnalyzer');
