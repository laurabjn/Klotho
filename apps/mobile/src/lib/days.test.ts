import {
  addDays,
  addMonths,
  endOfMonth,
  monthGrid,
  startOfWeek,
  toDay,
} from './days';

describe('days', () => {
  it('writes the local day', () => {
    expect(toDay(new Date(2026, 9, 1, 23, 30))).toBe('2026-10-01');
  });

  it('moves across months and years', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-01');
    expect(endOfMonth('2028-02-10')).toBe('2028-02-29');
  });

  it('starts weeks on Monday', () => {
    // Thursday 1 October 2026.
    expect(startOfWeek('2026-10-01')).toBe('2026-09-28');
    // A Sunday belongs to the week that started on the Monday before.
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28');
  });

  it('lays out a month in full weeks', () => {
    const weeks = monthGrid('2026-10-14');
    expect(weeks).toHaveLength(5);
    expect(weeks[0]![0]).toBe('2026-09-28');
    expect(weeks[4]![6]).toBe('2026-11-01');
  });
});
