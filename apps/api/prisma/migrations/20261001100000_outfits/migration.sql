-- CreateTable
CREATE TABLE "Outfit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "style" TEXT,
    "occasion" TEXT,
    "temperature" INTEGER,
    "weatherCondition" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "variantOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutfitItem" (
    "id" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "wardrobeItemId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "OutfitItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Outfit_userId_createdAt_idx" ON "Outfit"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OutfitItem_wardrobeItemId_idx" ON "OutfitItem"("wardrobeItemId");

-- CreateIndex
CREATE UNIQUE INDEX "OutfitItem_outfitId_role_key" ON "OutfitItem"("outfitId", "role");

-- AddForeignKey
ALTER TABLE "Outfit" ADD CONSTRAINT "Outfit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitItem" ADD CONSTRAINT "OutfitItem_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitItem" ADD CONSTRAINT "OutfitItem_wardrobeItemId_fkey" FOREIGN KEY ("wardrobeItemId") REFERENCES "WardrobeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

