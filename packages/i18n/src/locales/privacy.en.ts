import type { TranslationResource } from './fr';

export const privacyEn: TranslationResource['privacy'] = {
  title: 'Privacy',
  overline: 'Your data, your control',
  intro:
    'Klotho only keeps what it needs to put your outfits together. Nothing is sold or used for advertising.',
  sections: {
    data: {
      title: 'What Klotho stores',
      body: 'Your first name and e-mail (your account), your pieces and their photos, your style preferences, your outfits, your opinions, your favourites and the days you wore them. Your password is hashed: nobody can read it.',
    },
    location: {
      title: 'Your location',
      body: 'If you allow it, your approximate location is only used to get the local weather when you open the app. It is never stored. You can choose a city instead at any time, or withdraw the permission in the phone settings.',
      action: 'Choose my city or my location',
    },
    photos: {
      title: 'Your photos',
      body: 'The photos of your pieces are compressed then stored privately: only you can see them, through temporary links. Access to the camera and your gallery is only asked when you add a photo.',
    },
    partners: {
      title: 'Service providers',
      body: 'API hosting: Koyeb (French company, servers in the European Union). Database: Neon (servers in Frankfurt, Germany). Photos: Cloudflare R2 (data stored in the European Union). Password reset e-mails: Brevo (French company). Weather: OpenWeatherMap (only receives approximate coordinates, without your identity). Crash reporting: Sentry (servers in the European Union, technical reports without e-mail or name). AI photo analysis: Groq (United States), only when you ask for an analysis; the photo is sent without your name or e-mail.',
    },
    retention: {
      title: 'Retention',
      body: 'Your data is kept as long as your account exists. When you delete your account, everything is erased: your profile, your wardrobe, your photos, your outfits and your history.',
    },
    rights: {
      title: 'Your rights',
      body: 'You can access, correct, retrieve or erase your data, and object to its use. Write to [Contact e-mail]. You can also contact your data protection authority.',
    },
    legal: {
      title: 'Legal notice',
      body: 'Publisher: Laura Bojon EI, sole trader (micro-entreprise), SIRET 989 670 385 00016, 39 rue du Réduit, 33520 Bruges, France. Contact: [Contact e-mail]. Publication director: Laura Bojon. Host: Koyeb SAS, [Koyeb address].',
    },
  },
  delete: {
    title: 'Delete my account',
    body: 'Everything will be erased for good: your profile, your wardrobe, your photos, your outfits and your history.',
    action: 'Delete my account',
    confirmTitle: 'Delete your account?',
    confirmBody:
      'This cannot be undone. Enter your password to confirm the deletion of all your data.',
    password: 'Password',
    warning: 'This cannot be undone.',
    confirm: 'Yes, delete my account',
    cancel: 'Cancel',
  },
};
