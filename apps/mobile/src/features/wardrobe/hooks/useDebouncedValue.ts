import { useEffect, useState } from 'react';

/** Waits for the user to stop typing before searching. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (Object.is(value, debounced)) return; // nothing pending
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, debounced, delayMs]);
  return debounced;
}
