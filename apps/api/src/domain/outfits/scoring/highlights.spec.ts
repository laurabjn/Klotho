import { highlightsOf } from './highlights';

const breakdown = (overrides = {}) => ({
  weather: 0.5,
  compatibility: 0.5,
  style: 0.5,
  occasion: 0.5,
  color: 0.5,
  preferences: 0.5,
  usage: 0.5,
  ...overrides,
});

describe('highlightsOf', () => {
  it('tells the best qualities first, three at most', () => {
    expect(
      highlightsOf(
        breakdown({ weather: 0.9, style: 1, color: 0.8, occasion: 0.95 }),
      ),
    ).toEqual(['style', 'occasion', 'weather']);
  });

  it('suggests rediscovering rarely worn pieces', () => {
    expect(highlightsOf(breakdown({ style: 0.8, usage: 0.62 }))).toEqual([
      'style',
      'rediscover',
    ]);
  });

  it('says nothing that is not true', () => {
    expect(highlightsOf(breakdown())).toEqual([]);
  });
});
