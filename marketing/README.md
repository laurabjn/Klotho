# Visuels Klotho

Les visuels de la fiche Google Play et des publicités, composés en HTML puis
photographiés par Chrome.

```sh
python marketing/build.py
```

Il faut Python 3 et Google Chrome. Le script crée :

| Fichier                              | Usage                              |
| ------------------------------------ | ---------------------------------- |
| `store/feature-graphic-1024x500.png` | image de présentation Google Play  |
| `store/icon-512.png`                 | icône Google Play                  |
| `ads/carre-*-1080x1080.png`          | fil Instagram, Facebook, TikTok    |
| `ads/story-*-1080x1920.png`          | stories, reels, TikTok plein écran |
| `ads/epingle-*-1000x1500.png`        | épingle Pinterest                  |

Deux accroches (`a` : « Ta tenue du jour… », `b` : « Rien à te mettre ? ») et
deux boutons (`bientot`, `disponible` une fois l'app publiée). Les textes
sont dans `HOOKS`, `CTAS` et `SUB` en haut de `build.py`.

Le dossier `ads/` n'est pas versionné : relance le script pour le recréer.
Dans les stories, les textes restent hors des 250 px du haut et du bas,
masqués par l'interface d'Instagram et de TikTok.
