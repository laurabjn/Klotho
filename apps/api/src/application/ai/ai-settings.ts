export interface AiSettings {
  /** False without an AI key: the feature is hidden in the app. */
  enabled: boolean;
  /** Photo analyses offered to every account. */
  freePhotoAnalyses: number;
}

export const AI_SETTINGS = Symbol('AiSettings');
