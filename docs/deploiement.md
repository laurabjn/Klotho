# Mettre Klotho en ligne (bêta)

Hébergement gratuit, en Europe :

| Rôle                          | Service           | Offre                                 |
| ----------------------------- | ----------------- | ------------------------------------- |
| API                           | Koyeb             | instance gratuite, Paris ou Francfort |
| Base de données               | Neon (PostgreSQL) | gratuite, région Francfort            |
| Photos                        | Backblaze B2      | gratuit jusqu'à 10 Go, Amsterdam (UE) |
| E-mails (mot de passe oublié) | Brevo             | gratuit jusqu'à 300 e-mails/jour      |
| Plantages de l'app            | Sentry            | déjà créé (région UE)                 |

Les tarifs et offres gratuites changent : vérifie-les à l'inscription.
Ne colle jamais une clé ou un mot de passe dans le code ni dans un message :
uniquement dans les variables d'environnement des services.

## 1. Base de données : Neon

1. Crée un compte sur neon.tech, puis un projet `klotho`, région
   **AWS Europe Central 1 (Frankfurt)**.
2. Dans « Connection details », copie la chaîne de connexion **directe**
   (sans `-pooler` dans l'adresse). Elle ressemble à
   `postgresql://…@ep-….eu-central-1.aws.neon.tech/neondb?sslmode=require`.
   C'est ta variable `DATABASE_URL`.

## 2. Photos : Backblaze B2

Sans carte bancaire, 10 Go gratuits, serveurs à Amsterdam (UE).

1. Crée un compte sur backblaze.com (**B2 Cloud Storage**) en choisissant
   la région **EU Central** à l'inscription : elle ne peut plus changer
   ensuite.
2. **Buckets → Create a Bucket** : un nom unique au monde (par exemple
   `klotho-photos-laurabjn`), fichiers **Private**, chiffrement activé.
   Note l'**Endpoint** affiché sous le bucket, par exemple
   `s3.eu-central-003.backblazeb2.com`.
3. **Application Keys → Add a New Application Key** : accès au seul bucket
   ci-dessus, **Read and Write**. Note le **keyID** et l'**applicationKey**
   (affichée une seule fois).
4. Les variables de l'API :
   - `STORAGE_ENDPOINT` : `https://` + l'endpoint (étape 2) ;
   - `STORAGE_REGION` : la région de l'endpoint, par exemple
     `eu-central-003` ;
   - `STORAGE_BUCKET` : le nom du bucket ;
   - `STORAGE_ACCESS_KEY_ID` : le keyID ;
   - `STORAGE_SECRET_ACCESS_KEY` : l'applicationKey.

Cloudflare R2 marche aussi (endpoint
`https://<account-id>.eu.r2.cloudflarestorage.com`, région `auto`), mais
demande une carte bancaire.

## 3. E-mails : Brevo

1. Crée un compte sur brevo.com.
2. **Expéditeurs** : ajoute et vérifie ton adresse de contact (celle des
   mentions légales) : c'est `MAIL_FROM`.
3. **SMTP & API → Clés API** : crée une clé : c'est `BREVO_API_KEY`.

## 4. L'API : Koyeb

1. Crée un compte sur koyeb.com et connecte ton GitHub.
2. **Create Web Service → GitHub →** le dépôt `Klotho`, branche `main`.
3. Builder : **Dockerfile**, chemin `apps/api/Dockerfile`, contexte de
   build : la racine du dépôt (laisser vide).
4. Région : **Frankfurt** (ou Paris), instance **Free**.
5. Port exposé : **3100**, health check HTTP sur `/health`.
6. Variables d'environnement (mets les clés en **Secret**) :

   | Variable                    | Valeur                                                  |
   | --------------------------- | ------------------------------------------------------- |
   | `NODE_ENV`                  | `production`                                            |
   | `DATABASE_URL`              | la chaîne Neon (étape 1)                                |
   | `JWT_ACCESS_SECRET`         | une longue chaîne aléatoire (`openssl rand -base64 48`) |
   | `STORAGE_ENDPOINT`          | `https://s3.eu-central-003.backblazeb2.com` (étape 2)   |
   | `STORAGE_REGION`            | `eu-central-003` (étape 2)                              |
   | `STORAGE_BUCKET`            | ton bucket (étape 2)                                    |
   | `STORAGE_ACCESS_KEY_ID`     | keyID B2 (étape 2)                                      |
   | `STORAGE_SECRET_ACCESS_KEY` | applicationKey B2 (étape 2)                             |
   | `OPENWEATHER_API_KEY`       | ta clé OpenWeatherMap                                   |
   | `AI_API_KEY`                | ta clé Groq (analyse photo, facultative)                |
   | `MAIL_DRIVER`               | `brevo`                                                 |
   | `BREVO_API_KEY`             | clé Brevo (étape 3)                                     |
   | `MAIL_FROM`                 | ton adresse de contact vérifiée                         |
   | `TRUST_PROXY`               | `1`                                                     |

7. Déploie. Au démarrage, l'API applique elle-même les migrations de la
   base, puis démarre. Vérifie `https://<ton-service>.koyeb.app/health` :
   il doit répondre `{"status":"ok"}`.

Chaque merge sur `main` redéploie automatiquement l'API.

## 5. Paiements : Google Play et RevenueCat (quand tu actives Premium)

1. Crée ton compte développeur Google Play (25 $ une fois) et ton profil
   marchand.
2. Dans la Play Console, crée l'app `com.laurabjn.klotho`, puis les produits :
   - abonnements `klotho_premium_monthly` (4,99 €) et
     `klotho_premium_annual` (32,99 €) ;
   - produits intégrés `klotho_founders` (49,99 €, non consommable),
     `klotho_credits_25` (1,99 €) et `klotho_credits_75` (3,99 €),
     consommables.
3. Sur https://app.revenuecat.com, crée un projet et une app Google Play,
   relie-la à la Play Console (compte de service), importe les produits.
   Crée les droits (« entitlements ») `premium` (les deux abonnements) et
   `founders` (`klotho_founders`), et une offre contenant les 5 produits.
4. Clés : la clé publique Android (`goog_…`) va dans
   `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (build EAS), la clé secrète
   (`sk_…`) dans `REVENUECAT_SECRET_KEY` sur Koyeb.
5. Webhook RevenueCat : URL `https://<ton-service>.koyeb.app/billing/revenuecat`,
   « Authorization header » = une longue chaîne aléatoire, la même que
   `REVENUECAT_WEBHOOK_AUTH` sur Koyeb.
6. Mets `BILLING_ENABLED=true` sur Koyeb pour activer les limites gratuites,
   et `FOUNDERS_UNTIL` (par exemple `2027-01-31`) pour arrêter l'offre
   Founders à une date : l'écran Premium l'annonce, puis la retire.

Les achats se testent avec le build bêta et des comptes testeurs de la Play
Console (licences de test : rien n'est débité).

## 6. L'app : build bêta (EAS)

1. `npx eas-cli@latest login`, puis depuis `apps/mobile` :
   `npx eas-cli@latest init` (une seule fois).
2. Variables du profil `preview` (EAS n'envoie pas le fichier `.env`) :

   ```
   npx eas-cli@latest env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_API_URL --value https://<ton-service>.koyeb.app
   npx eas-cli@latest env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_SENTRY_DSN --value <ton DSN Sentry>
   ```

3. `npm run build:preview:android` (depuis `apps/mobile`, environ 15 min) :
   EAS donne un lien vers l'APK à envoyer aux testeuses.

## 7. Avant d'inviter les testeuses

- Complète `[E-mail de contact]` et `[adresse de Koyeb]` dans
  `packages/i18n/src/locales/privacy.fr.ts` et `privacy.en.ts`.
- Crée un compte dans l'app bêta, ajoute une pièce avec photo, génère une
  tenue, puis supprime le compte (Moi → Confidentialité) : tout doit
  fonctionner de bout en bout.
- Les indicateurs : `npm run kpis -w @klotho/api` avec la `DATABASE_URL` de
  Neon dans `apps/api/.env` (sans la commiter).
