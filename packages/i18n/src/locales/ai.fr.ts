// Photo analysis by AI (add a piece, photo step).
export const aiFr = {
  card: {
    title: 'Remplir avec Klotho IA',
    body: 'Klotho analyse ta photo principale et propose la catégorie, les couleurs, le style et la saison. Tu pourras tout corriger.',
    action: 'Analyser ma photo',
    remaining_one: '{{count}} analyse restante',
    remaining_other: '{{count}} analyses restantes',
    none: 'Tu as utilisé toutes tes analyses. Tu peux remplir la fiche toi-même, ou obtenir plus d’analyses.',
    more: 'Obtenir plus d’analyses',
    privacy:
      'Ta photo est envoyée à notre prestataire d’IA (Groq) uniquement pour cette analyse.',
  },
  analyzing: {
    title: 'Klotho analyse ta pièce…',
    body: 'Catégorie, couleurs, style, saison : un instant.',
  },
  prefilled: 'Pré-rempli par Klotho IA : vérifie et corrige si besoin.',
} as const;
