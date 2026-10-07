// Privacy policy, legal notices and account deletion (Moi → Confidentialité).
// The [bracketed] fields are to be completed by the publisher before release.
export const privacyFr = {
  title: 'Confidentialité',
  overline: 'Tes données, ton contrôle',
  intro:
    'Klotho ne garde que ce qui sert à composer tes tenues. Rien n’est vendu ni utilisé pour de la publicité.',
  sections: {
    data: {
      title: 'Ce que Klotho enregistre',
      body: 'Ton prénom et ton e-mail (ton compte), tes pièces et leurs photos, tes préférences de style, tes tenues, tes avis, tes favoris et les jours où tu les as portées. Ton mot de passe est chiffré : personne ne peut le lire.',
    },
    location: {
      title: 'Ta position',
      body: 'Si tu l’autorises, ta position approximative sert uniquement à obtenir la météo locale, au moment où tu ouvres l’app. Elle n’est jamais enregistrée. Tu peux à tout moment choisir une ville à la place, ou retirer l’autorisation dans les réglages du téléphone.',
      action: 'Choisir ma ville ou ma position',
    },
    photos: {
      title: 'Tes photos',
      body: 'Les photos de tes pièces sont compressées puis stockées de façon privée : elles ne sont visibles que par toi, via des liens temporaires. L’accès à l’appareil photo et à ta galerie n’est demandé que lorsque tu ajoutes une photo.',
    },
    partners: {
      title: 'Prestataires',
      body: 'Hébergement de l’API : Koyeb (société française, serveurs dans l’Union européenne). Base de données : Neon (serveurs à Francfort, Allemagne). Photos : Backblaze B2 (données stockées à Amsterdam, Pays-Bas). E-mails de mot de passe oublié : Brevo (société française). Météo : OpenWeatherMap (reçoit seulement des coordonnées approximatives, sans ton identité). Suivi des plantages : Sentry (serveurs dans l’Union européenne, rapports techniques sans e-mail ni nom). Paiements : Google Play ou l’App Store encaissent tes achats (Klotho ne voit jamais tes coordonnées bancaires) ; RevenueCat (États-Unis) reçoit ton identifiant Klotho et tes achats pour gérer l’abonnement. Analyse des photos par IA : Groq (États-Unis), seulement quand tu demandes une analyse ; la photo est envoyée sans ton nom ni ton e-mail.',
    },
    retention: {
      title: 'Durée de conservation',
      body: 'Tes données sont gardées tant que ton compte existe. Quand tu supprimes ton compte, tout est effacé : ton profil, ta garde-robe, tes photos, tes tenues et ton historique.',
    },
    rights: {
      title: 'Tes droits',
      body: 'Tu peux accéder à tes données, les corriger, les récupérer ou les effacer, et t’opposer à leur utilisation. Écris à [E-mail de contact]. Tu peux aussi saisir la CNIL (cnil.fr).',
    },
    legal: {
      title: 'Mentions légales',
      body: 'Éditrice : Laura Bojon EI, entrepreneuse individuelle (micro-entreprise), SIRET 989 670 385 00016, 39 rue du Réduit, 33520 Bruges, France. Contact : [E-mail de contact]. Directrice de la publication : Laura Bojon. Hébergeur : Koyeb SAS, [adresse de Koyeb].',
    },
  },
  delete: {
    title: 'Supprimer mon compte',
    body: 'Tout sera effacé définitivement : ton profil, ta garde-robe, tes photos, tes tenues et ton historique.',
    action: 'Supprimer mon compte',
    confirmTitle: 'Supprimer ton compte ?',
    confirmBody:
      'C’est définitif. Saisis ton mot de passe pour confirmer la suppression de toutes tes données.',
    password: 'Mot de passe',
    warning: 'Cette action est irréversible.',
    confirm: 'Oui, supprimer mon compte',
    cancel: 'Annuler',
  },
} as const;
