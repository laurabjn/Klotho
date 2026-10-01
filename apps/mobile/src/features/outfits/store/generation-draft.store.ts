import type { WardrobeItem } from '@klotho/shared';
import { create } from 'zustand';

interface GenerationDraftState {
  /** The "pièce imposée" chosen on its own screen, shown back in the form. */
  mandatoryItem: WardrobeItem | null;
  setMandatoryItem(item: WardrobeItem | null): void;
}

export const useGenerationDraftStore = create<GenerationDraftState>((set) => ({
  mandatoryItem: null,
  setMandatoryItem: (mandatoryItem) => set({ mandatoryItem }),
}));
