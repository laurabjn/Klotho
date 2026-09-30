-- CreateTable
CREATE TABLE "StyleProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredStyles" TEXT[],
    "preferredColors" TEXT[],
    "avoidedColors" TEXT[],
    "facePreferredColors" TEXT[],
    "colorSeason" TEXT,
    "preferredMetal" TEXT,
    "acceptsHeels" BOOLEAN,
    "preferredBottoms" TEXT[],
    "preferredFormality" INTEGER,
    "minLength" TEXT,
    "avoidsDeepNeckline" BOOLEAN,
    "onboardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StyleProfile_userId_key" ON "StyleProfile"("userId");

-- AddForeignKey
ALTER TABLE "StyleProfile" ADD CONSTRAINT "StyleProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
