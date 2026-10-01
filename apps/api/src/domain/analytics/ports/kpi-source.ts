/**
 * Raw, anonymous counts behind the beta KPIs (US9.4). Nothing in here can
 * identify a user: no id, no email, no name.
 */
export interface KpiFacts {
  users: number;
  /** One per user who generated at least one look: sign-up to first look (ms). */
  firstGenerationDelaysMs: number[];
  looksGenerated: number;
  likes: number;
  dislikes: number;
  wears: { total: number; last7Days: number; last30Days: number };
  favoriteLooks: number;
  favoritePieces: number;
}

export interface KpiSource {
  /** `today` is the last day counted by the "last N days" figures. */
  collect(today: Date): Promise<KpiFacts>;
}

export const KPI_SOURCE = Symbol('KpiSource');
