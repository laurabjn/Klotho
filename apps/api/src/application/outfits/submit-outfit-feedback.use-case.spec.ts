import { generateOutfitsSchema, outfitFeedbackSchema } from '@klotho/shared';

import { OutfitNotFoundError } from '../../domain/outfits/errors';
import { MINUTE } from '../../testing/fakes';
import { SpyNotifier } from '../../testing/in-memory-notification.repositories';
import { outfitWorkshop } from '../../testing/outfit-workshop';
import { CreateOutfitsUseCase } from './outfit.use-cases';
import {
  ClearOutfitFeedbackUseCase,
  SubmitOutfitFeedbackUseCase,
} from './submit-outfit-feedback.use-case';

describe('Outfit feedback (US8.1)', () => {
  let t: ReturnType<typeof outfitWorkshop>;
  let submit: SubmitOutfitFeedbackUseCase;
  let clear: ClearOutfitFeedbackUseCase;
  let outfitId: string;
  const body = (input: object) => outfitFeedbackSchema.parse(input);

  beforeEach(async () => {
    t = outfitWorkshop();
    submit = new SubmitOutfitFeedbackUseCase(t.workshop);
    clear = new ClearOutfitFeedbackUseCase(t.workshop);
    ({ id: outfitId } = await t.save('laura', [
      await t.add('laura', 'DRESS'),
      await t.add('laura', 'SHOES'),
    ]));
  });

  it('keeps the reasons and the note of a dislike', async () => {
    const outfit = await submit.execute(
      'laura',
      outfitId,
      body({
        rating: 'dislike',
        reasons: ['shoes', 'colors', 'shoes'],
        note: '  Trop sombre  ',
      }),
    );

    expect(outfit.feedback).toEqual({
      rating: 'dislike',
      reasons: ['shoes', 'colors'],
      note: 'Trop sombre',
      updatedAt: expect.any(String),
    });
  });

  it('drops the reasons of a like, and the last opinion wins', async () => {
    await submit.execute(
      'laura',
      outfitId,
      body({ rating: 'dislike', reasons: ['tooWarm'] }),
    );
    t.clock.advance(MINUTE);
    const outfit = await submit.execute(
      'laura',
      outfitId,
      body({ rating: 'like', reasons: ['tooWarm'] }),
    );

    expect(outfit.feedback).toMatchObject({ rating: 'like', reasons: [] });
    expect(t.outfits.feedbacks.size).toBe(1);
  });

  it('withdraws the opinion, idempotently', async () => {
    await submit.execute('laura', outfitId, body({ rating: 'like' }));

    await expect(clear.execute('laura', outfitId)).resolves.toMatchObject({
      feedback: null,
    });
    await expect(clear.execute('laura', outfitId)).resolves.toMatchObject({
      feedback: null,
    });
  });

  it("cannot rate another user's look", async () => {
    await expect(
      submit.execute('other', outfitId, body({ rating: 'like' })),
    ).rejects.toBeInstanceOf(OutfitNotFoundError);
    await expect(clear.execute('other', outfitId)).rejects.toBeInstanceOf(
      OutfitNotFoundError,
    );
    expect(t.outfits.feedbacks.size).toBe(0);
  });

  describe('the next looks', () => {
    let create: CreateOutfitsUseCase;
    const generate = () =>
      create.execute('laura', generateOutfitsSchema.parse({ temperature: 18 }));
    const mainIds = (outfit: {
      pieces: { role: string; item: { id: string } }[];
    }) =>
      outfit.pieces
        .filter((p) => !['bag', 'jewelry', 'accessory'].includes(p.role))
        .map((p) => p.item.id)
        .sort()
        .join();

    let notifier: SpyNotifier;

    beforeEach(async () => {
      notifier = new SpyNotifier();
      create = new CreateOutfitsUseCase(t.workshop, notifier);
      for (const category of [
        'TOP',
        'TOP',
        'BOTTOM',
        'BOTTOM',
        'SHOES',
      ] as const)
        await t.add('laura', category);
    });

    it('notifies the generated looks, with the best one', async () => {
      const looks = await generate();

      expect(notifier.calls).toEqual([
        {
          kind: 'outfitsGenerated',
          userId: 'laura',
          data: { count: looks.length, outfitId: looks[0]!.id },
        },
      ]);
    });

    it('never proposes a disliked look again', async () => {
      const first = await generate();
      const disliked = first[0]!;
      await submit.execute(
        'laura',
        disliked.id,
        body({ rating: 'dislike', reasons: ['association'] }),
      );

      const next = await generate();

      expect(next.map(mainIds)).not.toContain(mainIds(disliked));
    });

    it('takes likes and favourite pieces into account', async () => {
      const [first] = await generate();
      await submit.execute('laura', first!.id, body({ rating: 'like' }));
      const favorite = await t.add('laura', 'BAG');
      await t.wardrobe.setFavorite('laura', favorite.id, true);

      const context = await t.workshop.context(
        'laura',
        { style: null, occasion: null, temperature: 18, condition: null },
        await t.wardrobe.findAllOwned('laura'),
      );

      expect(context.feedback).toEqual({
        liked: [
          first!.pieces.filter((p) => p.role !== 'bag').map((p) => p.item.id),
        ],
        disliked: [],
        favoriteItemIds: [favorite.id],
      });
    });
  });
});
