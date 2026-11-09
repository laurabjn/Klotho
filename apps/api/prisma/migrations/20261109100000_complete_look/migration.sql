-- "Le look complet": optional hair and makeup preferences.
ALTER TABLE "StyleProfile" ADD COLUMN "hairLength" TEXT,
ADD COLUMN "hairTexture" TEXT,
ADD COLUMN "makeupPreference" TEXT;
