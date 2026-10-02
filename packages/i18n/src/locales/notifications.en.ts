import type { TranslationResource } from './fr';

export const notificationsEn: TranslationResource['notifications'] = {
  title: 'Notifications',
  overline: 'Stay informed and inspired',
  open: 'Notifications',
  openUnread_one: 'Notifications, {{count}} unread',
  openUnread_other: 'Notifications, {{count}} unread',
  tabs: { all: 'All', outfits: 'Outfits', dressing: 'Wardrobe' },
  markAll: 'Mark all as read',
  emptyTitle: 'No notification',
  emptyBody:
    'Klotho will tell you here about your new outfits and the pieces you forget.',
  unread: 'Unread',
  kinds: {
    outfitsGenerated: {
      title_one: '{{count}} new outfit generated',
      title_other: '{{count}} new outfits generated',
      body: 'Discover your new suggestions.',
    },
    weekPlanned: {
      title: 'Your week has been planned',
      body_one: '{{count}} outfit ready for you. Discover your planning!',
      body_other: '{{count}} outfits ready for you. Discover your planning!',
    },
    dailyOutfit: {
      title: 'Your outfit of the day is ready!',
      body: 'An outfit designed for today’s weather.',
    },
    forgottenPiece: {
      title_one: '“{{name}}” has not been worn for {{count}} week',
      title_other: '“{{name}}” has not been worn for {{count}} weeks',
      body: 'Rediscover this piece and find an outfit to bring it back into your style.',
      piece: 'One of your pieces',
    },
    pieceAvailable: {
      title: 'Your favourite piece is available again',
      body: '“{{name}}” is back in your wardrobe.',
    },
  },
  ago: {
    now: 'Just now',
    minutes: '{{count}} min ago',
    hours: '{{count}} h ago',
    days_one: '{{count}} day ago',
    days_other: '{{count}} days ago',
  },
  close: 'Close',
  local: {
    daily: {
      title: 'Your outfit of the day is waiting',
      body: 'Discover the outfit designed for your day.',
    },
    weekly: {
      title: 'Ready for the week?',
      body: 'Plan your outfits in a moment.',
    },
  },
  reminderTime: 'Reminder time',
  expoGo:
    'Phone reminders will work in the installed app (they are not available in Expo Go). Klotho notifications stay visible in the app.',
  permissionDenied:
    'Allow Klotho notifications in the phone settings to receive the reminders.',
  toast: {
    favoriteOutfit: 'Outfit added to favourites',
    favoritePiece: 'Piece added to favourites',
  },
};
