import type { TranslationResource } from './fr';

export const statesEn: TranslationResource['states'] = {
  emptyWardrobe: {
    title: 'My wardrobe is still empty',
    body: 'Add your first pieces so that Klotho can create outfits that look like you.',
    add: 'Add my first piece',
    example: 'See an example',
  },
  generating: {
    title: 'Klotho is creating your outfits…',
    steps: {
      wardrobe: 'Looking at your wardrobe',
      weather: 'Taking the weather into account',
      match: 'Matching the pieces',
      finish: 'Finishing the outfits…',
    },
    quote: '“One moment… The perfect outfit is on its way”',
  },
  noOutfit: {
    title: 'No suitable outfit for now',
    body: 'With the current weather and your criteria, no suitable outfit was found. You can adjust a few settings to get proposals.',
    adjust: 'Adjust my criteria',
    all: 'See all outfits',
  },
  offline: {
    title: 'Connection problem',
    body: 'Unable to reach the server. Check your internet connection and try again.',
    retry: 'Try again',
    offlineMode: 'Continue offline',
  },
  photos: {
    title: 'Allow access to your photos',
    body: 'It lets you add your pieces easily, by taking a picture or importing it from your gallery.',
    allow: 'Allow access',
    later: 'Later',
  },
  location: {
    title: 'Location permission',
    body: 'Your location lets Klotho adapt the outfits to your city’s weather. You can enter it by hand or change the permission later in the settings.',
    manual: 'Enter my city by hand',
    settings: 'Open the settings',
  },
  noResult: {
    title: 'No piece found',
    body: 'No piece matches your search “{{query}}”.',
    bodyFilters: 'No piece matches these filters.',
    clear: 'Clear the filters',
  },
  upload: {
    title: 'Add a piece',
    sending: 'Sending the photo…',
    sendingCount: 'Sending the photos… ({{done}}/{{total}})',
    keepOpen: 'Keep the app open while sending.',
    successTitle: 'Photo added!',
    successBody: 'Your piece has been added to your wardrobe.',
    details: 'Complete the details',
    another: 'Add another piece',
    errorTitle: 'Something went wrong',
    errorBody:
      'The photo could not be sent. Check your internet connection and try again.',
    retry: 'Try again',
    cancel: 'Cancel',
  },
};
