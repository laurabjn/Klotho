import type { KpiFacts } from '../../domain/analytics/ports/kpi-source';
import { computeKpis, formatKpis, median } from './kpis';

const HOUR = 60 * 60 * 1000;

const facts: KpiFacts = {
  users: 4,
  firstGenerationDelaysMs: [3 * HOUR, 1 * HOUR, 26 * HOUR],
  looksGenerated: 40,
  likes: 6,
  dislikes: 2,
  wears: { total: 9, last7Days: 3, last30Days: 7 },
  favoriteLooks: 5,
  favoritePieces: 11,
};

describe('KPIs', () => {
  it('computes the median of odd and even series', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it('aggregates the facts into rates and medians', () => {
    expect(computeKpis(facts)).toEqual({
      users: 4,
      activatedUsers: 3,
      activationRate: 0.75,
      medianHoursToFirstLook: 3,
      looksGenerated: 40,
      ratedLooks: 8,
      likeRate: 0.75,
      wornLooks: { total: 9, last7Days: 3, last30Days: 7 },
      favoriteLooks: 5,
      favoritePieces: 11,
    });
  });

  it('has no rate without data', () => {
    const report = computeKpis({
      ...facts,
      users: 0,
      firstGenerationDelaysMs: [],
      likes: 0,
      dislikes: 0,
    });
    expect(report).toMatchObject({
      activationRate: null,
      medianHoursToFirstLook: null,
      likeRate: null,
    });
    expect(formatKpis(report)).toContain('Like rate                      n/a');
  });

  it('prints numbers only', () => {
    const text = formatKpis(computeKpis(facts));
    expect(text).toContain('Like rate                      75.0 %');
    expect(text).toContain('Median sign-up to first look   3 h');
    expect(text).not.toMatch(/@/);
  });
});
