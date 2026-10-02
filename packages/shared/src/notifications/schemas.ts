import { z } from 'zod';

/** What a notification is about; its text is written by the app (i18n). */
export const NOTIFICATION_KINDS = [
  /** "5 nouvelles tenues générées". */
  'outfitsGenerated',
  /** "Ta semaine a été planifiée": 7 looks ready. */
  'weekPlanned',
  /** "Ta tenue du jour est prête" (planned or generated today). */
  'dailyOutfit',
  /** "Ton blazer beige n'a pas été porté depuis 3 semaines". */
  'forgottenPiece',
  /** "Ta pièce préférée est de nouveau disponible". */
  'pieceAvailable',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** The tabs of the "Notifications" mockup. */
export const NOTIFICATION_CATEGORIES = ['all', 'outfits', 'dressing'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const CATEGORY_OF: Record<
  NotificationKind,
  Exclude<NotificationCategory, 'all'>
> = {
  outfitsGenerated: 'outfits',
  weekPlanned: 'outfits',
  dailyOutfit: 'outfits',
  forgottenPiece: 'dressing',
  pieceAvailable: 'dressing',
};

/** GET /notifications?category=&page=&pageSize= : newest first. */
export const listNotificationsQuerySchema = z.object({
  category: z.enum(NOTIFICATION_CATEGORIES).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListNotificationsQueryInput = z.input<
  typeof listNotificationsQuerySchema
>;

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'errors.notifications.time' });

/**
 * GET / PUT /notifications/settings: the three switches of Paramètres, and
 * the time of the morning reminder (the phone's own clock).
 */
export const notificationSettingsSchema = z.object({
  /** "Conseils et inspirations personnalisés" (forgotten pieces…). */
  tips: z.boolean().default(true),
  /** "Rappels de tenues et suggestions" (look of the day, week planned…). */
  reminders: z.boolean().default(true),
  /** "Actualités et offres exclusives". */
  news: z.boolean().default(false),
  reminderTime: time.default('08:00'),
});
export type NotificationSettings = z.output<typeof notificationSettingsSchema>;
export type NotificationSettingsInput = z.input<
  typeof notificationSettingsSchema
>;

/** What the app needs to write and illustrate a notification. */
export interface NotificationData {
  /** outfitsGenerated, weekPlanned. */
  count?: number;
  /** dailyOutfit, weekPlanned (the first look), outfitsGenerated (the best). */
  outfitId?: string;
  /** forgottenPiece, pieceAvailable. */
  itemId?: string;
  /** The piece's name, null when it has none (forgottenPiece, pieceAvailable). */
  itemName?: string | null;
  /** forgottenPiece: weeks since it was last worn (or added). */
  weeks?: number;
  /** A photo to show beside the text (signed, expires), if any. */
  imageUrl?: string | null;
}

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  category: Exclude<NotificationCategory, 'all'>;
  data: NotificationData;
  read: boolean;
  createdAt: string;
}
