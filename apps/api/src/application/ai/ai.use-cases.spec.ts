import { parseUploadKey } from '../../domain/storage/upload-key';
import {
  AiQuotaExceededError,
  AiUnavailableError,
  NoGarmentError,
} from '../../domain/ai/errors';
import { InvalidImageError } from '../../domain/storage/errors';
import {
  FakeGarmentAnalyzer,
  InMemoryAiUsageRepository,
} from '../../testing/ai-fakes';
import {
  fakeImage,
  FakeImageProcessor,
  InMemoryFileStorage,
} from '../../testing/storage-fakes';
import {
  AnalyzeWardrobePhotoUseCase,
  GetAiCreditsUseCase,
} from './analyze-wardrobe-photo.use-case';
import { FixedClock } from '../../testing/fakes';
import { InMemoryBillingRepository } from '../../testing/billing-fakes';
import { PlanService } from '../billing/plan.service';
import type { AiSettings } from './ai-settings';

const LAURA = 'user-laura';
const OTHER = 'user-other';

describe('AI photo analysis', () => {
  let storage: InMemoryFileStorage;
  let analyzer: FakeGarmentAnalyzer;
  let usage: InMemoryAiUsageRepository;

  let clock: FixedClock;
  let billing: InMemoryBillingRepository;

  const setup = (
    settings: AiSettings = { enabled: true, freePhotoAnalyses: 2 },
  ) => {
    const plans = new PlanService(
      billing,
      usage,
      {
        enabled: true,
        free: { pieces: 50, generationsPerWeek: 10, historyDays: 7 },
        premiumMonthlyAnalyses: 3,
        foundersUntil: null,
      },
      settings,
      clock,
    );
    return {
      analyze: new AnalyzeWardrobePhotoUseCase(
        new FakeImageProcessor(),
        storage,
        analyzer,
        usage,
        settings,
        plans,
      ),
      credits: new GetAiCreditsUseCase(plans),
    };
  };

  beforeEach(() => {
    clock = new FixedClock();
    storage = new InMemoryFileStorage();
    analyzer = new FakeGarmentAnalyzer();
    usage = new InMemoryAiUsageRepository();
    usage.now = clock.now();
    billing = new InMemoryBillingRepository(clock);
  });

  it('proposes the attributes and stores the photo, ready to attach', async () => {
    const { analyze } = setup();

    const result = await analyze.execute(LAURA, fakeImage(), 'fr');

    expect(result.suggestion).toMatchObject({
      name: 'Blouse romantique',
      category: 'TOP',
      subcategory: 'blouse',
      primaryColor: 'white',
      styles: ['romantic'],
      secondaryColors: [],
      pattern: null,
    });
    expect(parseUploadKey(result.photo.key, LAURA)).toEqual({
      width: 1200,
      height: 1600,
    });
    expect(storage.files.has(result.photo.key)).toBe(true);
    expect(result.credits).toEqual({ enabled: true, remaining: 1, quota: 2 });
  });

  it('sends a smaller copy, in the language of the user', async () => {
    const { analyze } = setup();

    await analyze.execute(LAURA, fakeImage(), 'en');

    expect(analyzer.calls).toHaveLength(1);
    expect(analyzer.calls[0]).toMatchObject({
      language: 'en',
      image: { width: 600, height: 800 },
    });
  });

  it('records what each analysis cost', async () => {
    const { analyze } = setup();

    await analyze.execute(LAURA, fakeImage(), 'fr');

    expect(usage.records).toMatchObject([
      {
        userId: LAURA,
        feature: 'photoAnalysis',
        model: 'claude-test',
        inputTokens: 900,
        outputTokens: 120,
        pool: 'balance',
      },
    ]);
  });

  it('stops at the quota, without calling the AI, per user', async () => {
    const { analyze, credits } = setup();
    await analyze.execute(LAURA, fakeImage(), 'fr');
    await analyze.execute(LAURA, fakeImage(), 'fr');

    await expect(
      analyze.execute(LAURA, fakeImage(), 'fr'),
    ).rejects.toBeInstanceOf(AiQuotaExceededError);
    expect(analyzer.calls).toHaveLength(2);
    expect(await credits.execute(LAURA)).toEqual({
      enabled: true,
      remaining: 0,
      quota: 2,
    });
    expect(await credits.execute(OTHER)).toMatchObject({ remaining: 2 });
  });

  it('does not charge a photo without any piece, nor keep it', async () => {
    const { analyze, credits } = setup();
    analyzer.answer = { isGarment: false, attributes: {} };

    await expect(
      analyze.execute(LAURA, fakeImage(), 'fr'),
    ).rejects.toBeInstanceOf(NoGarmentError);

    expect(storage.files.size).toBe(0);
    expect(usage.records).toMatchObject([{ pool: null }]);
    expect(await credits.execute(LAURA)).toMatchObject({ remaining: 2 });
  });

  it('charges nothing when the AI is down', async () => {
    const { analyze, credits } = setup();
    analyzer.failing = true;

    await expect(
      analyze.execute(LAURA, fakeImage(), 'fr'),
    ).rejects.toBeInstanceOf(AiUnavailableError);

    expect(storage.files.size).toBe(0);
    expect(await credits.execute(LAURA)).toMatchObject({ remaining: 2 });
  });

  it('refuses what is not a picture before paying for it', async () => {
    const { analyze } = setup();

    await expect(
      analyze.execute(LAURA, new TextEncoder().encode('%PDF'), 'fr'),
    ).rejects.toBeInstanceOf(InvalidImageError);
    expect(analyzer.calls).toHaveLength(0);
  });

  it('is off without an AI key', async () => {
    const { analyze, credits } = setup({
      enabled: false,
      freePhotoAnalyses: 3,
    });

    expect(await credits.execute(LAURA)).toEqual({
      enabled: false,
      remaining: 0,
      quota: 3,
    });
    await expect(
      analyze.execute(LAURA, fakeImage(), 'fr'),
    ).rejects.toBeInstanceOf(AiUnavailableError);
    expect(analyzer.calls).toHaveLength(0);
  });

  it('adds the bought credits to the free analyses', async () => {
    const { analyze, credits } = setup();
    await billing.grantCredits(LAURA, {
      amount: 25,
      productId: 'klotho_credits_25',
      transactionId: 'GPA.1',
    });

    expect(await credits.execute(LAURA)).toEqual({
      enabled: true,
      remaining: 27,
      quota: 27,
    });
    await analyze.execute(LAURA, fakeImage(), 'fr');
    expect(await credits.execute(LAURA)).toMatchObject({ remaining: 26 });
  });

  it('takes Premium analyses from the month first, then the balance', async () => {
    const { analyze, credits } = setup();
    billing.entitlements.set(LAURA, {
      plan: 'premium',
      productId: 'klotho_premium_monthly',
      expiresAt: new Date('2026-11-01T00:00:00Z'),
    });
    // 3 a month in this setup, plus the 2 free ones.
    expect(await credits.execute(LAURA)).toMatchObject({ remaining: 5 });

    for (let i = 0; i < 4; i += 1)
      await analyze.execute(LAURA, fakeImage(), 'fr');

    expect(usage.records.map((r) => r.pool)).toEqual([
      'monthly',
      'monthly',
      'monthly',
      'balance',
    ]);
    expect(await credits.execute(LAURA)).toMatchObject({ remaining: 1 });
  });

  it('gives the monthly analyses again the next month', async () => {
    const { analyze, credits } = setup();
    billing.entitlements.set(LAURA, {
      plan: 'premium',
      productId: 'klotho_premium_annual',
      expiresAt: new Date('2027-10-01T00:00:00Z'),
    });
    for (let i = 0; i < 3; i += 1)
      await analyze.execute(LAURA, fakeImage(), 'fr');
    expect(await credits.execute(LAURA)).toMatchObject({ remaining: 2 });

    clock.advance(31 * 24 * 60 * 60 * 1000);

    expect(await credits.execute(LAURA)).toMatchObject({ remaining: 5 });
  });
});
