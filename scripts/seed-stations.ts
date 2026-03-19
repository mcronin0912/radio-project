/**
 * Seed database from stations-seed.json
 * Run: npx tsx scripts/seed-stations.ts
 * Or: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface SeedStation {
  slug: string;
  callsign: string;
  name: string;
  frequency: string;
  city: string;
  state: string;
  description: string | null;
  website: string | null;
  streamUrl: string | null;
  streamFormat: string | null;
  streamBitrate: number | null;
  metadataTier: number;
  metadataUrl: string | null;
  logoUrl: string | null;
  genres: string[];
  indigenous: boolean;
}

async function main() {
  const seedPath = path.join(process.cwd(), "stations-seed.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  const stations: SeedStation[] = JSON.parse(raw);

  console.log(`Seeding ${stations.length} stations...`);

  for (const s of stations) {
    await prisma.station.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        callsign: s.callsign,
        name: s.name,
        frequency: s.frequency,
        city: s.city,
        state: s.state,
        description: s.description ?? undefined,
        website: s.website ?? undefined,
        streamUrl: s.streamUrl ?? undefined,
        streamFormat: s.streamFormat ?? undefined,
        streamBitrate: s.streamBitrate ?? undefined,
        metadataTier: s.metadataTier,
        metadataUrl: s.metadataUrl ?? undefined,
        logoUrl: s.logoUrl ?? undefined,
        genres: s.genres,
        indigenous: s.indigenous,
      },
      update: {
        callsign: s.callsign,
        name: s.name,
        frequency: s.frequency,
        city: s.city,
        state: s.state,
        description: s.description ?? undefined,
        website: s.website ?? undefined,
        streamUrl: s.streamUrl ?? undefined,
        streamFormat: s.streamFormat ?? undefined,
        streamBitrate: s.streamBitrate ?? undefined,
        metadataTier: s.metadataTier,
        metadataUrl: s.metadataUrl ?? undefined,
        logoUrl: s.logoUrl ?? undefined,
        genres: s.genres,
        indigenous: s.indigenous,
      },
    });
    console.log(`  ✓ ${s.callsign} (${s.slug})`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
