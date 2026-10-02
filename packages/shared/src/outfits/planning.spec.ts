import {
  dayNoteSchema,
  movePlanSchema,
  planRangeQuerySchema,
  planWeekSchema,
} from './planning';

describe('planning schemas', () => {
  it('bounds the calendar period', () => {
    expect(
      planRangeQuerySchema.safeParse({ from: '2026-10-01', to: '2026-10-31' })
        .success,
    ).toBe(true);
    expect(
      planRangeQuerySchema.safeParse({ from: '2026-10-31', to: '2026-10-01' })
        .success,
    ).toBe(false);
    expect(
      planRangeQuerySchema.safeParse({ from: '2026-01-01', to: '2026-06-01' })
        .success,
    ).toBe(false);
  });

  it('plans a week with optional style and occasion', () => {
    expect(planWeekSchema.parse({ from: '2026-10-05' })).toEqual({
      from: '2026-10-05',
      style: null,
      occasion: null,
    });
    expect(movePlanSchema.safeParse({ toDay: '2026-02-30' }).success).toBe(
      false,
    );
  });

  it('turns an empty note into none', () => {
    expect(dayNoteSchema.parse({ text: '  ' })).toEqual({ text: null });
    expect(dayNoteSchema.safeParse({ text: 'a'.repeat(501) }).success).toBe(
      false,
    );
  });
});
