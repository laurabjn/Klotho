# Mettre Klotho en ligne (bêta)

Hébergement gratuit, en Europe :

| Rôle                          | Service           | Offre                                 |
| ----------------------------- | ----------------- | ------------------------------------- |
| API                           | Koyeb             | instance gratuite, Paris ou Francfort |
| Base de données               | Neon (PostgreSQL) | gratuite, région Francfort            |
| Photos                        | Cloudflare R2     | gratuit jusqu'à 10 Go, juridiction UE |
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

## 2. Photos : Cloudflare R2

1. Crée un compte Cloudflare, puis dans **R2** un bucket `klotho-photos`
   avec la juridiction **European Union (EU)**.
2. **R2 → Manage API tokens → Create API token**, permission
   « Object Read & Write » limitée au bucket `klotho-photos`. Note
   l'**Access Key ID** et le **Secret Access Key** (affichés une seule fois).
3. L'adresse du stockage pour un bucket UE est
   `https://<ton-account-id>.eu.r2.cloudflarestorage.com` (l'account id est
   visible dans la page R2).

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
   | `STORAGE_ENDPOINT`          | `https://<account-id>.eu.r2.cloudflarestorage.com`      |
   | `STORAGE_REGION`            | `auto`                                                  |
   | `STORAGE_BUCKET`            | `klotho-photos`                                         |
   | `STORAGE_ACCESS_KEY_ID`     | clé R2 (étape 2)                                        |
   | `STORAGE_SECRET_ACCESS_KEY` | secret R2 (étape 2)                                     |
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

## 5. L'app : build bêta (EAS)

1. `npx eas-cli@latest login`, puis depuis `apps/mobile` :
   `npx eas-cli@latest init` (une seule fois).
2. Variables du profil `preview` (EAS n'envoie pas le fichier `.env`) :

   ```
   npx eas-cli@latest env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_API_URL --value https://<ton-service>.koyeb.app
   npx eas-cli@latest env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_SENTRY_DSN --value <ton DSN Sentry>
   ```

3. `npm run build:preview:android` (depuis `apps/mobile`, environ 15 min) :
   EAS donne un lien vers l'APK à envoyer aux testeuses.

## 6. Avant d'inviter les testeuses

- Complète `[E-mail de contact]` et `[adresse de Koyeb]` dans
  `packages/i18n/src/locales/privacy.fr.ts` et `privacy.en.ts`.
- Crée un compte dans l'app bêta, ajoute une pièce avec photo, génère une
  tenue, puis supprime le compte (Moi → Confidentialité) : tout doit
  fonctionner de bout en bout.
- Les indicateurs : `npm run kpis -w @klotho/api` avec la `DATABASE_URL` de
  Neon dans `apps/api/.env` (sans la commiter).
