import { styleProfileSchema, weatherSettingsSchema } from '@klotho/shared';

import {
  NoOutfitPossibleError,
  OutfitNotFoundError,
} from '../../domain/outfits/errors';
import { PastDayError, PlanNotFoundError } from '../../domain/planning/errors';
import type { WardrobeItem } from '../../domain/wardrobe/entities/wardrobe-item.entity';
import {
  InMemoryDayNoteRepository,
  InMemoryOutfitPlanRepository,
} from '../../testing/in-memory-planning.repositories';
import { outfitWorkshop } from '../../testing/outfit-workshop';
import {
  FakeWeatherProvider,
  InMemoryWeatherSettingsRepository,
  LYON,
} from '../../testing/weather-fakes';
import { DayForecasts } from './day-forecasts';
import {
  DeletePlanUseCase,
  GetDayNoteUseCase,
  ListPlansUseCase,
  MovePlanUseCase,
  PlanOutfitUseCase,
  Planner,
  PlanWeekUseCase,
  RegeneratePlanUseCase,
  SaveDayNoteUseCase,
} from './planning.use-cases';

describe('Planning use cases', () => {
  let t: ReturnType<typeof outfitWorkshop>;
  let plans: InMemoryOutfitPlanRepository;
  let weather: FakeWeatherProvider;
  let settings: InMemoryWeatherSettingsRepository;
  let planner: Planner;
  let looks: string[];

  const saveCity = () =>
    settings.save(
      'laura',
      weatherSettingsSchema.parse({ locationMode: 'city', city: LYON }),
    );

  /** 3 tops, 3 bottoms, 2 dresses, 3 shoes. */
  async function wardrobe(userId = 'laura') {
    const pieces: WardrobeItem[] = [];
    for (const category of [
      'TOP',
      'TOP',
      'TOP',
      'BOTTOM',
      'BOTTOM',
      'BOTTOM',
      'DRESS',
      'DRESS',
      'SHOES',
      'SHOES',
      'SHOES',
    ] as const)
      pieces.push(await t.add(userId, category));
    return pieces;
  }

  beforeEach(async () => {
    t = outfitWorkshop();
    plans = new InMemoryOutfitPlanRepository(t.outfits);
    weather = new FakeWeatherProvider();
    settings = new InMemoryWeatherSettingsRepository();
    planner = new Planner(
      t.workshop,
      plans,
      new DayForecasts(weather, settings),
      t.clock,
    );
    const [top, , , bottom, , , dress, , shoes] = await wardrobe();
    looks = [
      (await t.save('laura', [top!, bottom!, shoes!])).id,
      (await t.save('laura', [dress!, shoes!])).id,
    ];
  });

  describe('PlanOutfitUseCase', () => {
    const plan = () => new PlanOutfitUseCase(planner);

    it("plans a look with the day's forecast of the saved city", async () => {
      await saveCity();

      const planned = await plan().execute('laura', '2026-10-02', looks[0]!);

      expect(planned).toMatchObject({
        day: '2026-10-02',
        outfit: { id: looks[0] },
        forecast: { temperature: 14, condition: 'rain' },
      });
      expect(weather.forecastCalls).toEqual([
        { latitude: 45.76, longitude: 4.84 },
      ]);
    });

    it('has no forecast without a saved city, beyond 5 days or on failure', async () => {
      await expect(
        plan().execute('laura', '2026-10-02', looks[0]!),
      ).resolves.toMatchObject({ forecast: null });
      expect(weather.forecastCalls).toHaveLength(0);

      await saveCity();
      await expect(
        plan().execute('laura', '2026-10-09', looks[0]!),
      ).resolves.toMatchObject({ forecast: null });

      weather.failing = true;
      await expect(
        plan().execute('laura', '2026-10-03', looks[0]!),
      ).resolves.toMatchObject({ forecast: null });
    });

    it("replaces the day's plan", async () => {
      const first = await plan().execute('laura', '2026-10-02', looks[0]!);
      const second = await plan().execute('laura', '2026-10-02', looks[1]!);

      expect(second).toMatchObject({ id: first.id, outfit: { id: looks[1] } });
      expect(plans.plans).toHaveLength(1);
    });

    it("cannot plan another user's look", async () => {
      await expect(
        plan().execute('other', '2026-10-02', looks[0]!),
      ).rejects.toBeInstanceOf(OutfitNotFoundError);
    });
  });

  describe('ListPlansUseCase and DeletePlanUseCase', () => {
    it('lists the plans of a period by day, and removes one', async () => {
      const plan = new PlanOutfitUseCase(planner);
      await plan.execute('laura', '2026-10-10', looks[0]!);
      await plan.execute('laura', '2026-10-02', looks[1]!);
      await plan.execute('laura', '2026-11-02', looks[1]!);
      const list = (userId = 'laura') =>
        new ListPlansUseCase(planner).execute(userId, {
          from: '2026-10-01',
          to: '2026-10-31',
        });

      expect((await list()).map((p) => [p.day, p.outfit.id])).toEqual([
        ['2026-10-02', looks[1]],
        ['2026-10-10', looks[0]],
      ]);
      await expect(list('other')).resolves.toEqual([]);

      const remove = new DeletePlanUseCase(planner);
      await remove.execute('laura', '2026-10-02');
      await remove.execute('laura', '2026-10-02');
      expect((await list()).map((p) => p.day)).toEqual(['2026-10-10']);
    });
  });

  describe('MovePlanUseCase', () => {
    const move = () => new MovePlanUseCase(planner);

    beforeEach(async () => {
      await saveCity();
      const plan = new PlanOutfitUseCase(planner);
      await plan.execute('laura', '2026-10-02', looks[0]!);
      await plan.execute('laura', '2026-10-04', looks[1]!);
    });

    it('moves a look to a free day, with that forecast', async () => {
      const [moved, ...others] = await move().execute(
        'laura',
        '2026-10-02',
        '2026-10-03',
      );

      expect(moved).toMatchObject({
        day: '2026-10-03',
        outfit: { id: looks[0] },
        forecast: { temperature: 16, condition: 'cloudy' },
      });
      expect(others).toEqual([]);
      expect(plans.plans.map((p) => p.day).sort()).toEqual([
        '2026-10-03',
        '2026-10-04',
      ]);
    });

    it('swaps with the look already planned; each day keeps its forecast', async () => {
      const before = await plans.findByDay('laura', '2026-10-04');

      const result = await move().execute('laura', '2026-10-02', '2026-10-04');

      expect(
        result.map((p) => [p.day, p.outfit.id, p.forecast?.temperature]),
      ).toEqual([
        ['2026-10-04', looks[0], 21],
        ['2026-10-02', looks[1], 14],
      ]);
      expect(result[1]!.id).toBe(before!.id);
    });

    it('keeps the stored forecasts when the weather is unavailable', async () => {
      weather.failing = true;

      const result = await move().execute('laura', '2026-10-02', '2026-10-04');

      expect(result.map((p) => p.forecast?.temperature)).toEqual([21, 14]);
    });

    it('returns the plan as is on the same day', async () => {
      await expect(
        move().execute('laura', '2026-10-02', '2026-10-02'),
      ).resolves.toMatchObject([{ day: '2026-10-02' }]);
    });

    it('needs a plan on that day', async () => {
      await expect(
        move().execute('laura', '2026-10-05', '2026-10-06'),
      ).rejects.toBeInstanceOf(PlanNotFoundError);
      await expect(
        move().execute('other', '2026-10-02', '2026-10-06'),
      ).rejects.toBeInstanceOf(PlanNotFoundError);
    });
  });

  describe('RegeneratePlanUseCase', () => {
    const regenerate = () => new RegeneratePlanUseCase(planner);

    it('plans one new look, with the style and occasion of the previous one', async () => {
      await saveCity();
      const [current] = await t.outfits.createMany('laura', [
        {
          ...(await t.outfits.findOwned('laura', looks[0]!))!,
          style: 'casual',
          occasion: 'work',
        },
      ]);
      await new PlanOutfitUseCase(planner).execute(
        'laura',
        '2026-10-02',
        current!.id,
      );

      const plan = await regenerate().execute('laura', '2026-10-02');

      expect(plan.outfit.id).not.toBe(current!.id);
      expect(plan.outfit).toMatchObject({
        style: 'casual',
        occasion: 'work',
        temperature: 14,
        condition: 'rain',
      });
      expect(plan.forecast).toEqual({ temperature: 14, condition: 'rain' });
      const key = (ids: string[]) => [...ids].sort().join('+');
      expect(key(plan.outfit.pieces.map((p) => p.item.id))).not.toBe(
        key(current!.pieces.map((p) => p.itemId)),
      );
      await expect(
        plans.findByDay('laura', '2026-10-02'),
      ).resolves.toMatchObject({ outfitId: plan.outfit.id });
    });

    it('needs a plan on that day', async () => {
      await expect(
        regenerate().execute('laura', '2026-10-02'),
      ).rejects.toBeInstanceOf(PlanNotFoundError);
    });

    it('fails when no other look is possible', async () => {
      const top = await t.add('solo', 'TOP');
      const bottom = await t.add('solo', 'BOTTOM');
      const shoes = await t.add('solo', 'SHOES');
      const only = await t.save('solo', [top, bottom, shoes]);
      await new PlanOutfitUseCase(planner).execute(
        'solo',
        '2026-10-02',
        only.id,
      );

      await expect(
        regenerate().execute('solo', '2026-10-02'),
      ).rejects.toBeInstanceOf(NoOutfitPossibleError);
    });
  });

  describe('PlanWeekUseCase', () => {
    const planWeek = () => new PlanWeekUseCase(planner);
    const command = (from: string) => ({ from, style: null, occasion: null });

    it('plans every free day until Sunday with varied looks and the forecasts', async () => {
      await saveCity();
      await new PlanOutfitUseCase(planner).execute(
        'laura',
        '2026-10-02',
        looks[0]!,
      );

      // 2026-10-01 is a Thursday.
      const created = await planWeek().execute('laura', command('2026-10-01'));

      expect(created.map((p) => [p.day, p.forecast?.temperature])).toEqual([
        ['2026-10-01', 19],
        ['2026-10-03', 16],
        ['2026-10-04', 21],
      ]);
      const keys = [looks[0]!, ...created.map((p) => p.outfit.id)].map((id) => {
        const look = t.outfits.outfits.find((o) => o.id === id)!;
        return look.pieces
          .map((p) => p.itemId)
          .sort()
          .join('+');
      });
      expect(new Set(keys).size).toBe(4);
      expect(created[0]!.outfit).toMatchObject({
        temperature: 19,
        condition: 'clear',
      });
    });

    it('avoids the pieces of the other days when it can', async () => {
      const created = await planWeek().execute('laura', command('2026-10-02'));

      // Friday to Sunday: 3 different bases (3 tops and bottoms, 2 dresses).
      const bases = created.map((p) =>
        p.outfit.pieces
          .filter((piece) => ['top', 'bottom', 'dress'].includes(piece.role))
          .map((piece) => piece.item.id)
          .sort()
          .join('+'),
      );
      expect(new Set(bases).size).toBe(3);
      const shoes = created.map(
        (p) => p.outfit.pieces.find((piece) => piece.role === 'shoes')!.item.id,
      );
      expect(new Set(shoes).size).toBe(3);
    });

    it('uses the current weather beyond the forecast, without storing it', async () => {
      await saveCity();

      const created = await planWeek().execute('laura', command('2026-10-05'));

      expect(created).toHaveLength(7);
      expect(created[0]!.forecast).toEqual({
        temperature: 12,
        condition: 'rain',
      });
      expect(created[6]).toMatchObject({
        day: '2026-10-11',
        forecast: null,
        outfit: { temperature: 18, condition: 'clear' },
      });
    });

    it("takes the user's first preferred style by default", async () => {
      await t.profiles.upsert(
        'laura',
        styleProfileSchema.parse({ preferredStyles: ['chic', 'casual'] }),
      );

      const [first] = await planWeek().execute('laura', command('2026-10-04'));

      expect(first!.outfit.style).toBe('chic');
    });

    it('accepts yesterday (time zones) but not before', async () => {
      await expect(
        planWeek().execute('laura', command('2026-09-29')),
      ).rejects.toBeInstanceOf(PastDayError);
      await expect(
        planWeek().execute('laura', command('2026-09-30')),
      ).resolves.toHaveLength(5);
    });

    it('returns nothing when the week is already planned', async () => {
      await new PlanOutfitUseCase(planner).execute(
        'laura',
        '2026-10-04',
        looks[0]!,
      );

      await expect(
        planWeek().execute('laura', command('2026-10-04')),
      ).resolves.toEqual([]);
    });

    it('fails when no day can be planned', async () => {
      await expect(
        planWeek().execute('empty', command('2026-10-01')),
      ).rejects.toBeInstanceOf(NoOutfitPossibleError);
      expect(plans.plans).toHaveLength(0);
    });
  });

  describe('day notes', () => {
    it('saves, reads and removes the note of a day', async () => {
      const notes = new InMemoryDayNoteRepository();
      const get = new GetDayNoteUseCase(notes);
      const save = new SaveDayNoteUseCase(notes);

      await expect(get.execute('laura', '2026-10-02')).resolves.toEqual({
        day: '2026-10-02',
        text: null,
      });
      await save.execute('laura', '2026-10-02', 'Dîner chez Léa');
      await expect(get.execute('laura', '2026-10-02')).resolves.toEqual({
        day: '2026-10-02',
        text: 'Dîner chez Léa',
      });
      await expect(get.execute('other', '2026-10-02')).resolves.toMatchObject({
        text: null,
      });

      await save.execute('laura', '2026-10-02', null);
      expect(notes.notes.size).toBe(0);
    });
  });
});
