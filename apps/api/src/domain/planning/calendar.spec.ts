import { addDays, daysBetween, sundayOf } from './calendar';

describe('calendar days', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('finds the Sunday of the week', () => {
    expect(sundayOf('2026-10-05')).toBe('2026-10-11'); // Monday
    expect(sundayOf('2026-10-10')).toBe('2026-10-11'); // Saturday
    expect(sundayOf('2026-10-11')).toBe('2026-10-11'); // Sunday
  });

  it('lists the days of a period, both included', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(daysBetween('2026-10-02', '2026-10-01')).toEqual([]);
  });
});
