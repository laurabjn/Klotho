# Campagne Google Ads

Une campagne **Promotion d'application**, objectif **Installations
d'application**, diffuse Klotho sur le Play Store, la recherche Google, YouTube
et les sites partenaires. Google compose les annonces à partir des textes, des
images et des vidéos ci-dessous.

## Mise en place

1. Dans Google Ads, **Outils**, **Comptes associés**, **Google Play** : relie la
   Play Console. Les installations sont alors mesurées sans rien ajouter à
   l'application.
2. **Nouvelle campagne**, **Promotion d'application**, **Installations
   d'application**, plateforme **Android**, puis choisis Klotho.
3. Zone : la France (ou les pays francophones), langue : français. Pour une
   campagne en anglais, crée une seconde campagne avec les textes anglais.
4. Budget : commence petit (par exemple 5 à 10 € par jour) pendant 2 à 3
   semaines, le temps que Google apprenne. Ne juge pas la campagne sur les
   premiers jours.
5. Ajoute les textes, les images et, dès qu'elles existent, les vidéos
   verticales de `videos-tiktok-reels.md`.

## Textes en français

| Titre (30 caractères max)     | Caractères |
| ----------------------------- | ---------- |
| Ta tenue du jour, sans stress | 29         |
| Ton dressing dans ta poche    | 26         |
| Des tenues selon la météo     | 25         |
| Fini le « rien à me mettre »  | 28         |
| Ton dressing, en douceur      | 24         |

| Description (90 caractères max)                                                      | Caractères |
| ------------------------------------------------------------------------------------ | ---------- |
| Prends tes vêtements en photo : Klotho range ta garde-robe et te propose des tenues. | 84         |
| Chaque matin, une tenue adaptée à la météo de ta ville, à ton style et à l’occasion. | 84         |
| Impose une pièce, écarte ce que tu n’aimes pas et planifie ta semaine de tenues.     | 80         |
| Application française, sans publicité. Gratuite pour commencer, Premium pour plus.   | 82         |
| 23 styles et ta palette de couleurs : des idées de tenues qui te ressemblent.        | 77         |

## Textes en anglais

| Titre (30 caractères max)      | Caractères |
| ------------------------------ | ---------- |
| Your outfit of the day, sorted | 30         |
| Your wardrobe in your pocket   | 28         |
| Outfits for the weather        | 23         |
| No more "nothing to wear"      | 25         |
| Your wardrobe, gently          | 21         |

| Description (90 caractères max)                                                       | Caractères |
| ------------------------------------------------------------------------------------- | ---------- |
| Snap your clothes: Klotho organises your wardrobe and suggests outfits that suit you. | 85         |
| Every morning, an outfit for the weather in your city, your style and the occasion.   | 83         |
| Pick a piece to wear, leave out what you dislike and plan your week of outfits.       | 79         |
| A French app with no ads. Free to start, Premium if you want more.                    | 66         |
| 23 styles and your colour palette: outfit ideas that feel like you.                   | 67         |

## Images

Créées par `python marketing/build.py` dans `marketing/ads/` (non versionné),
en deux accroches (`a`, `b`), avec le bouton « Disponible sur Google Play » :

| Fichier                           | Format         |
| --------------------------------- | -------------- |
| `google-paysage-*-1200x628.png`   | paysage 1,91:1 |
| `google-carre-*-1200x1200.png`    | carré 1:1      |
| `google-portrait-*-1200x1500.png` | portrait 4:5   |

Les images sont en français. Les textes de l'annonce ne doivent rien promettre
que l'application ne fait pas : le plan gratuit a des limites (voir l'écran
Premium).
