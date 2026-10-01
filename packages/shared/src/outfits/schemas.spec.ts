import {
  listOutfitsQuerySchema,
  markOutfitWornSchema,
  outfitFeedbackSchema,
  outfitHistoryQuerySchema,
} from './schemas';

describe('outfitFeedbackSchema', () => {
  it('keeps the reasons once each, and an empty note as none', () => {
    expect(
      outfitFeedbackSchema.parse({
        rating: 'dislike',
        reasons: ['colors', 'shoes', 'colors'],
        note: '  ',
      }),
    ).toEqual({ rating: 'dislike', reasons: ['colors', 'shoes'], note: null });
  });

  it('rejects an unknown rating or reason, and a long note', () => {
    expect(outfitFeedbackSchema.safeParse({ rating: 'meh' }).success).toBe(
      false,
    );
    expect(
      outfitFeedbackSchema.safeParse({ rating: 'like', reasons: ['ugly'] })
        .success,
    ).toBe(false);
    expect(
      outfitFeedbackSchema.safeParse({ rating: 'like', note: 'a'.repeat(251) })
        .success,
    ).toBe(false);
  });
});

describe('markOutfitWornSchema', () => {
  it('takes a real calendar day only', () => {
    expect(markOutfitWornSchema.parse({ wornOn: '2026-10-01' })).toEqual({
      wornOn: '2026-10-01',
    });
    for (const wornOn of ['2026-02-31', '01/10/2026', '2026-1-1', ''])
      expect(markOutfitWornSchema.safeParse({ wornOn }).success).toBe(false);
  });
});

describe('listOutfitsQuerySchema', () => {
  it('lists the generated looks by default, 20 per page', () => {
    expect(listOutfitsQuerySchema.parse({})).toEqual({
      filter: 'generated',
      page: 1,
      pageSize: 20,
    });
    expect(
      listOutfitsQuerySchema.parse({ filter: 'favorites', page: '2' }),
    ).toMatchObject({ filter: 'favorites', page: 2 });
    expect(listOutfitsQuerySchema.safeParse({ filter: 'all' }).success).toBe(
      false,
    );
  });
});

describe('outfitHistoryQuerySchema', () => {
  it('accepts an ordered period', () => {
    expect(
      outfitHistoryQuerySchema.parse({ from: '2026-10-01', to: '2026-10-31' }),
    ).toMatchObject({ from: '2026-10-01', to: '2026-10-31', page: 1 });
    expect(
      outfitHistoryQuerySchema.safeParse({
        from: '2026-10-31',
        to: '2026-10-01',
      }).success,
    ).toBe(false);
  });
});
