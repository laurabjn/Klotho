-- Several jewellery metals can now be chosen. "mixed" and "none" disappear:
-- mixed = several metals ticked, no preference = none ticked.

-- AlterTable
ALTER TABLE "StyleProfile" ADD COLUMN "preferredMetals" TEXT[];

-- Keep the single choice already saved.
UPDATE "StyleProfile"
SET "preferredMetals" = CASE
    WHEN "preferredMetal" IN ('gold', 'silver', 'roseGold') THEN ARRAY["preferredMetal"]
    WHEN "preferredMetal" = 'mixed' THEN ARRAY['gold', 'silver', 'roseGold']
    ELSE ARRAY[]::TEXT[]
END;

-- AlterTable
ALTER TABLE "StyleProfile" DROP COLUMN "preferredMetal";
