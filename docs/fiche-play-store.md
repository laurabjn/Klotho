# Fiche Google Play de Klotho

Tout ce qu'il faut copier dans la Play Console. Les limites de caractères
sont celles de Google (titre 30, description courte 80, description longue
4000).

## Adresses à renseigner

| Champ de la Play Console                     | Valeur                                                 |
| -------------------------------------------- | ------------------------------------------------------ |
| Règles de confidentialité                    | `https://klotho-api.onrender.com/legal/privacy`        |
| Suppression du compte (Sécurité des données) | `https://klotho-api.onrender.com/legal/delete-account` |
| Conditions d'utilisation (si demandé)        | `https://klotho-api.onrender.com/legal/terms`          |
| E-mail de contact                            | ton adresse Klotho (celle de Brevo et des mentions)    |
| Nom du package                               | `com.laurabjn.klotho`                                  |

Ajoute `?lang=en` pour la version anglaise de chaque page.

## Textes (français, langue principale)

**Nom de l'application** (26/30) :

> Klotho : Dressing & Tenues

**Description courte** (75/80) :

> Organise ta garde-robe et reçois ta tenue du jour selon la météo. Sans pub.

**Description longue** :

> Klotho, c'est ton dressing dans ta poche, avec une touche de douceur.
>
> Ajoute tes pièces en photo, et Klotho t'aide à composer des tenues qui te
> ressemblent, selon la météo du jour, ton style et l'occasion.
>
> ✿ TON DRESSING, ENFIN RANGÉ
> • Prends tes vêtements en photo (jusqu'à 5 par pièce)
> • Klotho peut pré-remplir la fiche depuis la photo : catégorie, couleurs,
> style, saison
> • Retrouve chaque pièce en un instant : filtres par catégorie, couleur,
> saison, style ou température
>
> ✿ UNE TENUE POUR CHAQUE JOUR
> • Des propositions selon la météo de ta ville, ton style et l'occasion
> (travail, rendez-vous, week-end…)
> • Impose une pièce que tu veux porter, écarte ce que tu n'aimes pas
> • Remplace une pièce, crée des variantes, garde tes tenues favorites
>
> ✿ TA SEMAINE, PLANIFIÉE
> • Prévois tes tenues de la semaine dans le calendrier
> • Un rappel le matin avec ta tenue du jour
> • Ton historique pour ne pas remettre la même tenue trop souvent
>
> ✿ UN STYLE QUI TE RESSEMBLE
> • 23 styles, de romantique à streetwear, de parisien à victorien
> • Ta palette de couleurs et tes métaux préférés
>
> ✿ TES DONNÉES, TON CONTRÔLE
> • Aucune publicité
> • Tes photos restent privées, hébergées en Europe
> • Supprime ton compte et toutes tes données à tout moment
>
> Klotho est une application française, pensée pour toutes celles qui ont
> « rien à se mettre » devant une armoire pleine.

## Textes (anglais)

**Nom** : `Klotho: Wardrobe & Outfits`

**Description courte** :

> Organise your wardrobe and get your outfit of the day for the weather. No ads.

**Description longue** : reprendre la version française traduite ; je peux la
rédiger au moment d'ajouter l'anglais à la fiche.

## Catégorie et coordonnées

- Type : **Application**, catégorie **Style de vie** (Lifestyle).
- Tags suggérés : mode, garde-robe, tenues, style.
- Gratuite (les achats intégrés viendront avec Premium).
- Contient des annonces : **Non**.

## Public cible et contenu

- Tranche d'âge : **16 ans et plus**, ou **18 ans et plus**. Les conditions
  générales disent 15 ans et plus, mais Google ne propose pas cette tranche :
  prends la tranche supérieure la plus proche.
- L'application n'attire pas spécialement les enfants : **Non**.
- Questionnaire de classification : pas de violence, de sexualité, de
  langage grossier, de drogue, de jeu d'argent ; les utilisatrices
  **n'échangent pas de contenu** entre elles (les photos restent privées) ;
  la position n'est pas partagée avec d'autres utilisatrices. Résultat
  attendu : PEGI 3 / Tout public.
- Application d'actualités, de santé, gouvernementale : **Non**.

## Sécurité des données (réponses)

- Données collectées ou partagées : **Oui** (collectées).
- Chiffrées pendant le transfert : **Oui** (HTTPS).
- Suppression sur demande : **Oui** (lien ci-dessus).

| Type de données (Google)                    | Collectée | Partagée | Obligatoire | Pourquoi                                                |
| ------------------------------------------- | --------- | -------- | ----------- | ------------------------------------------------------- |
| Nom (prénom)                                | Oui       | Non      | Oui         | Gestion du compte, fonctionnalités de l'app             |
| Adresse e-mail                              | Oui       | Non      | Oui         | Gestion du compte, communications (mot de passe oublié) |
| Photos                                      | Oui       | Non      | Non         | Fonctionnalités de l'app (dressing, analyse IA)         |
| Position approximative                      | Oui       | Non      | Non         | Fonctionnalités de l'app (météo), non conservée         |
| Activité dans l'app (tenues, favoris, avis) | Oui       | Non      | Oui         | Fonctionnalités de l'app                                |
| Journaux de plantage, diagnostics           | Oui       | Non      | Non         | Analyse, correction des bugs (Sentry)                   |
| Historique d'achats                         | Plus tard | Non      | Non         | Quand Premium sera activé (RevenueCat)                  |

Les envois à nos prestataires (hébergement, météo, IA, e-mails, plantages)
ne comptent pas comme un « partage » au sens de Google : ils traitent les
données pour notre compte. Vérifie chaque libellé au moment de remplir le
formulaire, Google le fait évoluer.

## Visuels à préparer

| Visuel                     | Format                      | Idée                                                                  |
| -------------------------- | --------------------------- | --------------------------------------------------------------------- |
| Icône                      | 512 × 512 px, PNG           | l'icône de l'app (`assets/icon.png`, agrandie)                        |
| Image de présentation      | 1024 × 500 px, JPG ou PNG   | logo Klotho sur une illustration de dressing (une des images ChatGPT) |
| Captures d'écran téléphone | 2 à 8, format portrait 9:16 | voir ci-dessous                                                       |

Captures proposées, chacune avec une phrase courte en haut :

1. Accueil avec la tenue du jour : « Ta tenue du jour, selon la météo »
2. Ma garde-robe : « Tout ton dressing, enfin rangé »
3. Ajouter une pièce avec Klotho IA : « Une photo, et la fiche se remplit »
4. Créer une tenue : « Ton style, l'occasion, la météo »
5. Résultats des tenues : « Des idées qui te ressemblent »
6. Calendrier : « Ta semaine de tenues, planifiée »

## Avant d'envoyer en production

1. Compte développeur créé et vérifié.
2. Build de production : `npm run build:production:android` depuis
   `apps/mobile` (fichier AAB, version 1.0.0). EAS demande d'utiliser la
   même clé de signature que la bêta : accepte.
3. Envoie l'AAB en **test fermé** et invite au moins 12 testeuses (adresses
   Gmail). Un compte personnel doit garder ce test ouvert **14 jours** avant
   de pouvoir demander la publication en production.
4. Remplis la fiche, la classification, le public cible et la sécurité des
   données avec ce document.
