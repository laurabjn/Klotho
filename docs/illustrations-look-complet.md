# Illustrations du look complet

45 illustrations, une par coiffure et par maquillage. Tant qu'une image
manque, l'application affiche une icône à la place : on peut les ajouter au
fur et à mesure.

## Format

- Carrées, 1024 × 1024, fond transparent (PNG), dans le même style que les
  illustrations de l'application (`apps/mobile/assets/states/`).
- Nommées par leur clé : `lowBun.png`, `classicRed.png`…
- Déposées dans `apps/mobile/assets/looks/`. Elles seront converties en
  `.webp` et ajoutées à `lookPhotos` dans `apps/mobile/src/theme/photos.ts`.

## Prompt commun

Commence chaque demande par ce texte, puis ajoute le sujet de la ligne :

```text
Illustration douce et romantique, style aquarelle numérique délicate, tons rose poudré, beige et doré, petites fleurs et étincelles dorées discrètes, fond transparent, cadrage carré centré, sans texte. Une femme vue de trois quarts, visage simple et serein sans détails réalistes. Sujet :
```

Pour les coiffures, le sujet est la coiffure vue de dos ou de trois quarts.
Pour les maquillages, c'est le visage de près, les yeux et les lèvres bien
visibles.

## Coiffures

| Fichier          | Sujet                                                    |
| ---------------- | -------------------------------------------------------- |
| `lowBun`         | chignon bas élégant et lisse sur la nuque                |
| `messyBun`       | chignon flou sur le haut de la tête, mèches libres       |
| `frenchTwist`    | chignon banane vertical à l'arrière de la tête           |
| `victorianUpdo`  | chignon haut torsadé de style victorien, ruban           |
| `halfBun`        | demi-chignon au sommet, le reste des cheveux lâché       |
| `spaceBuns`      | deux petits macarons hauts de chaque côté                |
| `highPonytail`   | queue de cheval haute et dynamique                       |
| `ribbonPonytail` | queue de cheval basse nouée d'un gros nœud en ruban      |
| `sleekPonytail`  | queue de cheval lisse et brillante, plaquée en arrière   |
| `dutchBraid`     | tresse collée du front jusqu'à la nuque                  |
| `fishtailBraid`  | longue tresse épi sur l'épaule                           |
| `braidedCrown`   | tresses en couronne autour de la tête                    |
| `halfUp`         | demi-queue attachée à l'arrière, cheveux lâchés          |
| `glamWaves`      | grandes ondulations glamour brillantes, style Hollywood  |
| `retroCurls`     | boucles courtes rétro des années 50                      |
| `sixtiesVolume`  | volume sur le dessus façon années 60, pinces sur le côté |
| `beachWaves`     | ondulations naturelles et légères                        |
| `sleekStraight`  | cheveux lisses et brillants, raie nette                  |
| `tuckedBob`      | carré rentré derrière l'oreille avec une pince           |
| `wetLook`        | cheveux courts plaqués en arrière, effet mouillé         |
| `definedCurls`   | boucles naturelles définies et volumineuses              |
| `texturedPixie`  | coupe courte texturée et ébouriffée                      |
| `headband`       | cheveux lâchés avec un bandeau en velours                |
| `headscarf`      | foulard en soie noué sur les cheveux                     |
| `hairClips`      | raie sur le côté avec plusieurs barrettes alignées       |

## Maquillages

| Fichier          | Sujet                                                          |
| ---------------- | -------------------------------------------------------------- |
| `naturalNude`    | maquillage nude naturel, presque invisible, lèvres rosées      |
| `freshGlow`      | teint frais et lumineux, joues éclatantes, baume brillant      |
| `rosyMonochrome` | même rose doux sur les paupières, les joues et les lèvres      |
| `sportProof`     | maquillage minimal et frais, cils noirs, lèvres baume          |
| `powderPink`     | fard et rouge à lèvres rose poudré, joues roses                |
| `peachGlow`      | blush pêche, paupières dorées, gloss corail                    |
| `sunBronze`      | teint bronzé ensoleillé, paupières bronze                      |
| `officeFresh`    | teint net, fard taupe mat, lèvres rosées mates                 |
| `classicRed`     | lèvres rouge vif classiques, teint léger                       |
| `graphicLiner`   | trait d'eye-liner graphique étiré vers la tempe                |
| `softSmoky`      | smoky eyes doux brun prune, lèvres nude                        |
| `berryLips`      | lèvres couleur baie, effet mordu                               |
| `y2kGloss`       | lèvres très brillantes au gloss rosé, paupières pailletées     |
| `glitter`        | paillettes dorées sur les paupières, lèvres nude               |
| `victorianPale`  | teint de porcelaine, joues rosées, lèvres rouge sombre estompé |
| `coloredLiner`   | trait d'eye-liner bleu électrique au ras des cils              |
| `pastelEyes`     | paupières lilas et menthe pastel, lumineuses                   |
| `sunsetEyes`     | dégradé orange, rose et doré sur les paupières                 |
| `brightLips`     | lèvres fuchsia vif, teint léger                                |
| `jewelEyes`      | paupières émeraude irisées, effet pierre précieuse             |
