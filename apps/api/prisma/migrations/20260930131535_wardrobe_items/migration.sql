-- CreateEnum
CREATE TYPE "WardrobeCategory" AS ENUM ('TOP', 'BOTTOM', 'DRESS', 'LAYER', 'SHOES', 'BAG', 'ACCESSORY', 'JEWELRY', 'UNDERWEAR');

-- CreateEnum
CREATE TYPE "WardrobeStatus" AS ENUM ('AVAILABLE', 'WASHING', 'LENT', 'ARCHIVED', 'SOLD', 'DONATED');

-- CreateTable
CREATE TABLE "WardrobeItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "category" "WardrobeCategory" NOT NULL,
    "subcategory" TEXT,
    "primaryColor" TEXT NOT NULL,
    "secondaryColors" TEXT[],
    "pattern" TEXT,
    "material" TEXT,
    "styles" TEXT[],
    "seasons" TEXT[],
    "minTemperature" INTEGER,
    "maxTemperature" INTEGER,
    "warmthLevel" INTEGER,
    "formalityLevel" INTEGER,
    "brand" TEXT,
    "size" TEXT,
    "status" "WardrobeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "wearCount" INTEGER NOT NULL DEFAULT 0,
    "lastWornAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WardrobeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WardrobeItem_userId_category_status_idx" ON "WardrobeItem"("userId", "category", "status");

-- CreateIndex
CREATE INDEX "WardrobeItem_userId_createdAt_idx" ON "WardrobeItem"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WardrobeItem_userId_lastWornAt_idx" ON "WardrobeItem"("userId", "lastWornAt");

-- AddForeignKey
ALTER TABLE "WardrobeItem" ADD CONSTRAINT "WardrobeItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
