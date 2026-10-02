-- CreateTable
CREATE TABLE "OutfitPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "forecastTemperature" INTEGER,
    "forecastCondition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutfitPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "text" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutfitPlan_outfitId_idx" ON "OutfitPlan"("outfitId");

-- CreateIndex
CREATE UNIQUE INDEX "OutfitPlan_userId_day_key" ON "OutfitPlan"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "DayNote_userId_day_key" ON "DayNote"("userId", "day");

-- AddForeignKey
ALTER TABLE "OutfitPlan" ADD CONSTRAINT "OutfitPlan_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitPlan" ADD CONSTRAINT "OutfitPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayNote" ADD CONSTRAINT "DayNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

