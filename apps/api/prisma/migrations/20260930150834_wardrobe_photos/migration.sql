-- CreateTable
CREATE TABLE "WardrobeItemPhoto" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WardrobeItemPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WardrobeItemPhoto_storageKey_key" ON "WardrobeItemPhoto"("storageKey");

-- CreateIndex
CREATE INDEX "WardrobeItemPhoto_itemId_position_idx" ON "WardrobeItemPhoto"("itemId", "position");

-- AddForeignKey
ALTER TABLE "WardrobeItemPhoto" ADD CONSTRAINT "WardrobeItemPhoto_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "WardrobeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
