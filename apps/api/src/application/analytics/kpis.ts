import type { KpiFacts } from '../../domain/analytics/ports/kpi-source';

export interface KpiReport {
  users: number;
  /** Users who generated at least one look. */
  activatedUsers: number;
  /** activatedUsers / users, null without users. */
  activationRate: number | null;
  /** Median time from sign-up to the first look, in hours. */
  medianHoursToFirstLook: number | null;
  looksGenerated: number;
  ratedLooks: number;
  /** likes / rated looks, null when no look was rated. */
  likeRate: number | null;
  wornLooks: { total: number; last7Days: number; last30Days: number };
  favoriteLooks: number;
  favoritePieces: number;
}

const HOUR = 60 * 60 * 1000;

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

const ratio = (part: number, whole: number) =>
  whole === 0 ? null : Math.round((part / whole) * 1000) / 1000;

/** Aggregates the raw facts into the beta KPIs; pure, so unit-tested. */
export function computeKpis(facts: KpiFacts): KpiReport {
  const delay = median(facts.firstGenerationDelaysMs);
  const ratedLooks = facts.likes + facts.dislikes;
  return {
    users: facts.users,
    activatedUsers: facts.firstGenerationDelaysMs.length,
    activationRate: ratio(facts.firstGenerationDelaysMs.length, facts.users),
    medianHoursToFirstLook:
      delay === null ? null : Math.round((delay / HOUR) * 10) / 10,
    looksGenerated: facts.looksGenerated,
    ratedLooks,
    likeRate: ratio(facts.likes, ratedLooks),
    wornLooks: { ...facts.wears },
    favoriteLooks: facts.favoriteLooks,
    favoritePieces: facts.favoritePieces,
  };
}

const percent = (value: number | null) =>
  value === null ? 'n/a' : `${(value * 100).toFixed(1)} %`;

export function formatKpis(report: KpiReport): string {
  const hours =
    report.medianHoursToFirstLook === null
      ? 'n/a'
      : `${report.medianHoursToFirstLook} h`;
  const worn = report.wornLooks;
  return [
    `Users                          ${report.users}`,
    `Users with a first look        ${report.activatedUsers} (${percent(report.activationRate)})`,
    `Median sign-up to first look   ${hours}`,
    `Looks generated                ${report.looksGenerated}`,
    `Looks rated                    ${report.ratedLooks}`,
    `Like rate                      ${percent(report.likeRate)}`,
    `Looks worn                     ${worn.total} (last 7 days: ${worn.last7Days}, last 30 days: ${worn.last30Days})`,
    `Favourite looks                ${report.favoriteLooks}`,
    `Favourite pieces               ${report.favoritePieces}`,
  ].join('\n');
}
