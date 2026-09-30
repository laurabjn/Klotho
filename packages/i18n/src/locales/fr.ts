// French is the reference locale: every other locale must match its keys.
export const fr = {
  common: {
    appName: 'Klotho',
    loading: 'Chargement…',
    error: 'Une erreur est survenue.',
    retry: 'Réessayer',
  },
  home: {
    title: 'Bienvenue dans ton dressing',
    subtitle: 'Des tenues pensées à partir de tes vraies pièces.',
  },
} as const;

type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export type TranslationResource = DeepString<typeof fr>;
