-- AlterTable
ALTER TABLE "Outfit" ADD COLUMN     "favoritedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WardrobeItem" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OutfitFeedback" (
    "id" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "reasons" TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutfitFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutfitWear" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "wornOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutfitWear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutfitFeedback_userId_idx" ON "OutfitFeedback"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OutfitFeedback_outfitId_userId_key" ON "OutfitFeedback"("outfitId", "userId");

-- CreateIndex
CREATE INDEX "OutfitWear_userId_wornOn_idx" ON "OutfitWear"("userId", "wornOn");

-- CreateIndex
CREATE UNIQUE INDEX "OutfitWear_outfitId_wornOn_key" ON "OutfitWear"("outfitId", "wornOn");

-- CreateIndex
CREATE INDEX "Outfit_userId_isFavorite_favoritedAt_idx" ON "Outfit"("userId", "isFavorite", "favoritedAt");

-- AddForeignKey
ALTER TABLE "OutfitFeedback" ADD CONSTRAINT "OutfitFeedback_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitFeedback" ADD CONSTRAINT "OutfitFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitWear" ADD CONSTRAINT "OutfitWear_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitWear" ADD CONSTRAINT "OutfitWear_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

