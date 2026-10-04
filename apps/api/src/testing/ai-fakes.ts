import { AiUnavailableError } from '../domain/ai/errors';
import type {
  AiFeature,
  AiUsageRecord,
  AiUsageRepository,
} from '../domain/ai/ports/ai-usage.repository';
import type {
  GarmentAnalysis,
  GarmentAnalyzer,
} from '../domain/ai/ports/garment-analyzer';
import type { ProcessedImage } from '../domain/storage/ports/image-processor';

export class InMemoryAiUsageRepository implements AiUsageRepository {
  readonly records: AiUsageRecord[] = [];

  record(usage: AiUsageRecord): Promise<void> {
    this.records.push(usage);
    return Promise.resolve();
  }

  countCharged(userId: string, feature: AiFeature): Promise<number> {
    return Promise.resolve(
      this.records.filter(
        (r) => r.userId === userId && r.feature === feature && r.charged,
      ).length,
    );
  }
}

const BLOUSE: Omit<GarmentAnalysis, 'usage'> = {
  isGarment: true,
  attributes: {
    name: 'Blouse romantique',
    category: 'TOP',
    subcategory: 'blouse',
    primaryColor: 'white',
    styles: ['romantic'],
    seasons: ['spring', 'summer'],
  },
};

/** Answers `answer` (a white blouse by default) and remembers what it saw. */
export class FakeGarmentAnalyzer implements GarmentAnalyzer {
  readonly calls: { image: ProcessedImage; language: 'fr' | 'en' }[] = [];
  /** When set, the AI is down. */
  failing = false;
  answer: Omit<GarmentAnalysis, 'usage'> = BLOUSE;

  reset(): void {
    this.calls.length = 0;
    this.failing = false;
    this.answer = BLOUSE;
  }

  analyze(
    image: ProcessedImage,
    language: 'fr' | 'en',
  ): Promise<GarmentAnalysis> {
    this.calls.push({ image, language });
    if (this.failing) return Promise.reject(new AiUnavailableError());
    return Promise.resolve({
      ...this.answer,
      usage: { model: 'claude-test', inputTokens: 900, outputTokens: 120 },
    });
  }
}
