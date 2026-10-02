import type { NotificationKind, NotificationSettings } from '@klotho/shared';

import type { StoredNotification } from './ports/notification.repository';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** The switch of Paramètres each kind depends on ("news" gates nothing yet). */
export const SETTING_OF: Record<
  NotificationKind,
  keyof Pick<NotificationSettings, 'tips' | 'reminders'>
> = {
  outfitsGenerated: 'reminders',
  weekPlanned: 'reminders',
  dailyOutfit: 'reminders',
  forgottenPiece: 'tips',
  pieceAvailable: 'tips',
};

export const isEnabled = (
  kind: NotificationKind,
  settings: NotificationSettings,
): boolean => settings[SETTING_OF[kind]];

/** Generations this close to an unread notification of them join it. */
export const GROUPING_WINDOW_MS = 10 * MINUTE_MS;

/** A piece is forgotten once not worn (or, never worn, not added) for this long. */
export const FORGOTTEN_AFTER_MS = 21 * DAY_MS;

/** At most one forgotten piece a week. */
export const FORGOTTEN_EVERY_MS = 7 * DAY_MS;

/** Whether new generated looks join the user's newest notification. */
export function joinsLatest(
  latest: StoredNotification | null,
  now: Date,
): latest is StoredNotification {
  return (
    latest !== null &&
    latest.kind === 'outfitsGenerated' &&
    latest.readAt === null &&
    now.getTime() - latest.createdAt.getTime() <= GROUPING_WINDOW_MS
  );
}

/** Midnight UTC: the dailyOutfit uses the server's (UTC) calendar day. */
export const startOfUtcDay = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

/** Whole weeks between two dates (at least 0). */
export const weeksBetween = (from: Date, to: Date): number =>
  Math.max(0, Math.floor((to.getTime() - from.getTime()) / (7 * DAY_MS)));
