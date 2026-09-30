import type { Style } from '@klotho/shared';
import { create } from 'zustand';

interface DailyStyleState {
  style: Style | null;
  /** Day it was chosen: the choice only holds for that day. */
  day: string | null;
  choose(style: Style | null): void;
}

const today = () => new Date().toDateString();

/** "Mon style du jour": kept on the phone, used by the outfit generation. */
export const useDailyStyleStore = create<DailyStyleState>((set) => ({
  style: null,
  day: null,
  choose: (style) => set({ style, day: today() }),
}));

export function useDailyStyle(): Style | null {
  return useDailyStyleStore((state) =>
    state.day === today() ? state.style : null,
  );
}
