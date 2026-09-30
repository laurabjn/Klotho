import { create } from 'zustand';

interface ManualTemperatureState {
  /** In °C, like every temperature handled by the app. */
  celsius: number | null;
  /** Day it was entered: it only replaces the weather for that day. */
  day: string | null;
  set(celsius: number): void;
  clear(): void;
}

const today = () => new Date().toDateString();

/** Temperature entered by hand; kept on the phone only, until the end of the day. */
export const useManualTemperatureStore = create<ManualTemperatureState>(
  (set) => ({
    celsius: null,
    day: null,
    set: (celsius) => set({ celsius, day: today() }),
    clear: () => set({ celsius: null, day: null }),
  }),
);

export function useManualTemperature(): number | null {
  return useManualTemperatureStore((state) =>
    state.day === today() ? state.celsius : null,
  );
}
