// Notifications centre, home banner, phone reminders and toasts.
export const notificationsFr = {
  title: 'Notifications',
  overline: 'Reste informée et inspirée',
  open: 'Notifications',
  openUnread_one: 'Notifications, {{count}} non lue',
  openUnread_other: 'Notifications, {{count}} non lues',
  tabs: { all: 'Toutes', outfits: 'Tenues', dressing: 'Dressing' },
  markAll: 'Tout marquer comme lu',
  emptyTitle: 'Aucune notification',
  emptyBody:
    'Klotho te préviendra ici de tes nouvelles tenues et des pièces que tu oublies.',
  unread: 'Non lue',
  kinds: {
    outfitsGenerated: {
      title_one: '{{count}} nouvelle tenue générée',
      title_other: '{{count}} nouvelles tenues générées',
      body: 'Découvre tes nouvelles suggestions.',
    },
    weekPlanned: {
      title: 'Ta semaine a été planifiée',
      body_one: '{{count}} tenue prête pour toi. Découvre ton planning !',
      body_other:
        '{{count}} tenues prêtes pour t’accompagner. Découvre ton planning !',
    },
    dailyOutfit: {
      title: 'Ta tenue du jour est prête !',
      body: 'Une tenue pensée pour la météo d’aujourd’hui.',
    },
    forgottenPiece: {
      title_one: '« {{name}} » n’a pas été portée depuis {{count}} semaine',
      title_other: '« {{name}} » n’a pas été portée depuis {{count}} semaines',
      body: 'Redécouvre cette pièce et trouve une tenue pour la remettre au cœur de ton style.',
      piece: 'Une de tes pièces',
    },
    pieceAvailable: {
      title: 'Ta pièce préférée est de nouveau disponible',
      body: '« {{name}} » est de retour dans ta garde-robe.',
    },
  },
  ago: {
    now: 'À l’instant',
    minutes: 'Il y a {{count}} min',
    hours: 'Il y a {{count}} h',
    days_one: 'Il y a {{count}} jour',
    days_other: 'Il y a {{count}} jours',
  },
  close: 'Fermer',
  local: {
    daily: {
      title: 'Ta tenue du jour t’attend',
      body: 'Découvre la tenue pensée pour ta journée.',
    },
    weekly: {
      title: 'Prête pour la semaine ?',
      body: 'Planifie tes tenues en un instant.',
    },
  },
  reminderTime: 'Heure du rappel',
  expoGo:
    'Les rappels sur le téléphone fonctionneront dans l’app installée (ils ne sont pas disponibles dans Expo Go). Les notifications de Klotho restent visibles dans l’app.',
  permissionDenied:
    'Autorise les notifications de Klotho dans les réglages du téléphone pour recevoir les rappels.',
  toast: {
    favoriteOutfit: 'Tenue ajoutée aux favoris',
    favoritePiece: 'Pièce ajoutée aux favoris',
  },
} as const;
