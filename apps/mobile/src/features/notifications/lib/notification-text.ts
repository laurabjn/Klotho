import type { AppNotification } from '@klotho/shared';
import type { TFunction } from 'i18next';

import type { IconName } from '@/theme/icons';

export interface NotificationView {
  icon: IconName;
  title: string;
  body: string;
  /** Where pressing it leads. */
  route: string;
}

/** The text of a notification, in the app's language. */
export function describeNotification(
  t: TFunction,
  notification: AppNotification,
): NotificationView {
  const { data } = notification;
  const count = data.count ?? 1;
  const name = data.itemName ?? t('notifications.kinds.forgottenPiece.piece');
  const look = data.outfitId ? `/outfits/${data.outfitId}` : '/my-outfits';
  const piece = data.itemId ? `/piece/${data.itemId}` : '/wardrobe';

  switch (notification.kind) {
    case 'outfitsGenerated':
      return {
        icon: 'creation',
        title: t('notifications.kinds.outfitsGenerated.title', { count }),
        body: t('notifications.kinds.outfitsGenerated.body'),
        route: look,
      };
    case 'weekPlanned':
      return {
        icon: 'calendar-blank-outline',
        title: t('notifications.kinds.weekPlanned.title'),
        body: t('notifications.kinds.weekPlanned.body', { count }),
        route: '/calendar',
      };
    case 'dailyOutfit':
      return {
        icon: 'creation',
        title: t('notifications.kinds.dailyOutfit.title'),
        body: t('notifications.kinds.dailyOutfit.body'),
        route: look,
      };
    case 'forgottenPiece':
      return {
        icon: 'hanger',
        title: t('notifications.kinds.forgottenPiece.title', {
          name,
          count: data.weeks ?? 3,
        }),
        body: t('notifications.kinds.forgottenPiece.body'),
        route: piece,
      };
    case 'pieceAvailable':
      return {
        icon: 'heart-outline',
        title: t('notifications.kinds.pieceAvailable.title'),
        body: t('notifications.kinds.pieceAvailable.body', { name }),
        route: piece,
      };
  }
}

const MINUTE = 60_000;

/** "Il y a 10 min", "Il y a 2 h", "Il y a 1 jour". */
export function timeAgo(t: TFunction, iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / MINUTE));
  if (minutes < 1) return t('notifications.ago.now');
  if (minutes < 60) return t('notifications.ago.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('notifications.ago.hours', { count: hours });
  return t('notifications.ago.days', { count: Math.floor(hours / 24) });
}
