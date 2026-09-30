-- CreateTable
CREATE TABLE "WeatherSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationMode" TEXT,
    "cityName" TEXT,
    "cityCountry" TEXT,
    "cityRegion" TEXT,
    "cityLatitude" DOUBLE PRECISION,
    "cityLongitude" DOUBLE PRECISION,
    "temperatureUnit" TEXT NOT NULL DEFAULT 'celsius',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherSettings_userId_key" ON "WeatherSettings"("userId");

-- AddForeignKey
ALTER TABLE "WeatherSettings" ADD CONSTRAINT "WeatherSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

