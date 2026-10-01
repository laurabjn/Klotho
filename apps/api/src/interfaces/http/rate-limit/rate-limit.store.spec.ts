import { RateLimitStore } from './rate-limit.store';

describe('RateLimitStore', () => {
  let now: number;
  let store: RateLimitStore;

  beforeEach(() => {
    now = 1_000_000;
    store = new RateLimitStore(() => now);
  });

  it('allows `limit` hits per window, then reports when to retry', () => {
    expect(store.hit('k', 2, 60_000).allowed).toBe(true);
    expect(store.hit('k', 2, 60_000).allowed).toBe(true);
    now += 15_000;
    expect(store.hit('k', 2, 60_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 45,
    });
  });

  it('starts a new window once the previous one is over', () => {
    store.hit('k', 1, 60_000);
    expect(store.hit('k', 1, 60_000).allowed).toBe(false);
    now += 60_000;
    expect(store.hit('k', 1, 60_000).allowed).toBe(true);
  });

  it('counts each key on its own', () => {
    store.hit('a', 1, 60_000);
    expect(store.hit('b', 1, 60_000).allowed).toBe(true);
  });

  it('forgets expired windows when it grows large', () => {
    for (let i = 0; i < 10_000; i++) store.hit(`k${i}`, 1, 1000);
    now += 1000;
    store.hit('fresh', 1, 1000);
    expect(store.size).toBe(1);
  });
});
