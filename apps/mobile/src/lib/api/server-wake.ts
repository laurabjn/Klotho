import { create } from 'zustand';

/** Answers slower than this are announced ("Klotho se réveille…"). */
export const SLOW_ANSWER_MS = 4_000;

/**
 * The free server sleeps after a while without visits and takes about a
 * minute to wake up: the requests still waiting past SLOW_ANSWER_MS.
 */
export const useServerWake = create<{ slowRequests: number }>(() => ({
  slowRequests: 0,
}));

/** Call when a request starts; call the returned function when it ends. */
export function watchSlowAnswer(): () => void {
  let slow = false;
  const timer = setTimeout(() => {
    slow = true;
    useServerWake.setState((s) => ({ slowRequests: s.slowRequests + 1 }));
  }, SLOW_ANSWER_MS);
  return () => {
    clearTimeout(timer);
    if (slow)
      useServerWake.setState((s) => ({ slowRequests: s.slowRequests - 1 }));
  };
}
