-- CreateTable
CREATE TABLE "Province" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "pinyin" TEXT,
    "lat" REAL,
    "lng" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "pinyin" TEXT,
    "provinceId" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "level" TEXT,
    "areaCode" TEXT,
    "zipCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "City_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "pinyin" TEXT,
    "cityId" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TangpingCity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cityId" TEXT NOT NULL,
    "isFocus" BOOLEAN NOT NULL DEFAULT false,
    "tangpingScore" REAL,
    "rank" INTEGER,
    "description" TEXT,
    "tags" TEXT,
    "districtNames" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TangpingCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TargetLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tangpingCityId" TEXT NOT NULL,
    "districtId" TEXT,
    "lat" REAL,
    "lng" REAL,
    "avgPrice" REAL,
    "rentPrice" REAL,
    "description" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TargetLocation_tangpingCityId_fkey" FOREIGN KEY ("tangpingCityId") REFERENCES "TangpingCity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TargetLocation_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CityEconomy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tangpingCityId" TEXT NOT NULL,
    "population" REAL,
    "gdp" REAL,
    "gdpPerCapita" REAL,
    "disposableIncome" REAL,
    "avgSalary" REAL,
    "unemploymentRate" REAL,
    "dataYear" INTEGER,
    "dataSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CityEconomy_tangpingCityId_fkey" FOREIGN KEY ("tangpingCityId") REFERENCES "TangpingCity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CityHousing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tangpingCityId" TEXT NOT NULL,
    "avgSecondHandPrice" TEXT,
    "avgSecondHandPriceNum" REAL,
    "suitePrice" TEXT,
    "suitePriceNum" REAL,
    "lowPriceArea" TEXT,
    "lowPrice" TEXT,
    "lowPriceNum" REAL,
    "rentPriceRange" TEXT,
    "rentPriceMin" REAL,
    "rentPriceMax" REAL,
    "priceYoY" REAL,
    "dataSource" TEXT,
    "dataDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CityHousing_tangpingCityId_fkey" FOREIGN KEY ("tangpingCityId") REFERENCES "TangpingCity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CityMedical" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tangpingCityId" TEXT NOT NULL,
    "hospitalLevelRaw" TEXT,
    "hospitalLevel" TEXT,
    "hospitalName" TEXT,
    "hospitalCount3A" INTEGER,
    "hospitalCount" INTEGER,
    "bedsPer1000" REAL,
    "doctorsPer1000" REAL,
    "hospitalList" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CityMedical_tangpingCityId_fkey" FOREIGN KEY ("tangpingCityId") REFERENCES "TangpingCity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CityClimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tangpingCityId" TEXT NOT NULL,
    "latitudeTypeRaw" TEXT,
    "latitudeType" TEXT,
    "comfortDays" INTEGER,
    "greenCoverageRate" REAL,
    "avgTempYear" REAL,
    "avgTempSummer" REAL,
    "avgTempWinter" REAL,
    "precipitation" REAL,
    "avgAqi" REAL,
    "goodAirDays" INTEGER,
    "climateDescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CityClimate_tangpingCityId_fkey" FOREIGN KEY ("tangpingCityId") REFERENCES "TangpingCity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CityLiving" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tangpingCityId" TEXT NOT NULL,
    "hygieneLevelRaw" TEXT,
    "hygieneLevel" TEXT,
    "consumptionLevelRaw" TEXT,
    "consumptionLevel" TEXT,
    "activePopulation" TEXT,
    "cpi" REAL,
    "foodCostDaily" REAL,
    "tangpingGroupCount" INTEGER,
    "tangpingPopulation" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CityLiving_tangpingCityId_fkey" FOREIGN KEY ("tangpingCityId") REFERENCES "TangpingCity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CityTransport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tangpingCityId" TEXT NOT NULL,
    "airplaneRaw" TEXT,
    "airplane" TEXT,
    "highSpeedRailRaw" TEXT,
    "highSpeedRail" TEXT,
    "cityRailRaw" TEXT,
    "cityRail" TEXT,
    "subwayBusRaw" TEXT,
    "subwayBus" TEXT,
    "cityBusRaw" TEXT,
    "cityBus" TEXT,
    "railwayRaw" TEXT,
    "railway" TEXT,
    "hasAirport" BOOLEAN NOT NULL DEFAULT false,
    "hasHighSpeedRail" BOOLEAN NOT NULL DEFAULT false,
    "hasCityRail" BOOLEAN NOT NULL DEFAULT false,
    "hasSubway" BOOLEAN NOT NULL DEFAULT false,
    "transportScore" REAL,
    "nearestAirport" TEXT,
    "airportDistance" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CityTransport_tangpingCityId_fkey" FOREIGN KEY ("tangpingCityId") REFERENCES "TangpingCity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Weather" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cityId" TEXT NOT NULL,
    "temp" REAL NOT NULL,
    "weather" TEXT NOT NULL,
    "humidity" INTEGER NOT NULL,
    "windSpeed" REAL NOT NULL,
    "aqi" INTEGER,
    "aqiLevel" TEXT,
    "forecast" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Weather_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cityId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "author" TEXT,
    "authorAvatar" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "sentiment" TEXT,
    "sentimentScore" REAL,
    "url" TEXT,
    "coverImage" TEXT,
    "publishedAt" DATETIME,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialNote_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cityId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "News_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "lastSyncAt" DATETIME,
    "syncStatus" TEXT,
    "recordCount" INTEGER,
    "version" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScraperLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scraper" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "cityName" TEXT,
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "note" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Province_name_key" ON "Province"("name");

-- CreateIndex
CREATE INDEX "City_provinceId_idx" ON "City"("provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "City_provinceId_name_key" ON "City"("provinceId", "name");

-- CreateIndex
CREATE INDEX "District_cityId_idx" ON "District"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "TangpingCity_cityId_key" ON "TangpingCity"("cityId");

-- CreateIndex
CREATE INDEX "TargetLocation_tangpingCityId_idx" ON "TargetLocation"("tangpingCityId");

-- CreateIndex
CREATE UNIQUE INDEX "CityEconomy_tangpingCityId_key" ON "CityEconomy"("tangpingCityId");

-- CreateIndex
CREATE UNIQUE INDEX "CityHousing_tangpingCityId_key" ON "CityHousing"("tangpingCityId");

-- CreateIndex
CREATE UNIQUE INDEX "CityMedical_tangpingCityId_key" ON "CityMedical"("tangpingCityId");

-- CreateIndex
CREATE UNIQUE INDEX "CityClimate_tangpingCityId_key" ON "CityClimate"("tangpingCityId");

-- CreateIndex
CREATE UNIQUE INDEX "CityLiving_tangpingCityId_key" ON "CityLiving"("tangpingCityId");

-- CreateIndex
CREATE UNIQUE INDEX "CityTransport_tangpingCityId_key" ON "CityTransport"("tangpingCityId");

-- CreateIndex
CREATE INDEX "Weather_cityId_idx" ON "Weather"("cityId");

-- CreateIndex
CREATE INDEX "SocialNote_cityId_platform_idx" ON "SocialNote"("cityId", "platform");

-- CreateIndex
CREATE INDEX "News_cityId_idx" ON "News"("cityId");

-- CreateIndex
CREATE INDEX "ScraperLog_scraper_createdAt_idx" ON "ScraperLog"("scraper", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_cityId_key" ON "Favorite"("userId", "cityId");
