-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "streamUrl" TEXT,
    "streamFormat" TEXT,
    "streamBitrate" INTEGER,
    "metadataTier" INTEGER NOT NULL DEFAULT 3,
    "metadataUrl" TEXT,
    "logoUrl" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "indigenous" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NowPlaying" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "artist" TEXT,
    "title" TEXT,
    "album" TEXT,
    "artUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NowPlaying_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistItem" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "artist" TEXT,
    "title" TEXT,
    "album" TEXT,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Station_slug_key" ON "Station"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NowPlaying_stationId_key" ON "NowPlaying"("stationId");

-- CreateIndex
CREATE INDEX "PlaylistItem_stationId_playedAt_idx" ON "PlaylistItem"("stationId", "playedAt" DESC);

-- AddForeignKey
ALTER TABLE "NowPlaying" ADD CONSTRAINT "NowPlaying_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistItem" ADD CONSTRAINT "PlaylistItem_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
