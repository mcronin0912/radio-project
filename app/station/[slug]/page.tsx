import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getStationBySlug, getStations } from "@/lib/stations";
import { ExternalLink, Radio } from "lucide-react";
import { LiveIndicator } from "@/components/stations/LiveIndicator";
import { PlayButton } from "@/components/stations/PlayButton";

export function generateStaticParams() {
  return getStations().map((s) => ({ slug: s.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const station = getStationBySlug(slug);
  if (!station) return { title: "Station not found" };
  return {
    title: `${station.name} — Radio Project`,
    description:
      station.description ??
      `Listen to ${station.name} from ${station.city}, ${station.state}`,
  };
}

export default async function StationPage({ params }: PageProps) {
  const { slug } = await params;

  const station = getStationBySlug(slug);

  if (!station) notFound();

  return (
    <main className="mx-auto max-w-page px-4 py-8 pb-32 sm:px-6">
      <Link
        href="/"
        className="inline-block text-[13px] font-normal text-fog transition-colors hover:text-mist"
      >
        ← Back to directory
      </Link>

      <header className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-cards bg-paper shadow-subtle">
          {station.logoUrl ? (
            <Image
              src={station.logoUrl}
              alt=""
              width={96}
              height={96}
              className="size-full object-cover"
              unoptimized
            />
          ) : (
            <Radio className="h-10 w-10 text-ash" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[32px] font-medium leading-[1.13] tracking-[-0.022em] text-paper">
            {station.name}
          </h1>
          <p className="mt-2 text-[15px] font-normal text-fog">
            {[
              Array.from(
                new Set([station.city, station.state].filter(Boolean))
              ).join(", ") || null,
              station.frequency,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {station.description && (
            <p className="mt-4 text-[16px] font-normal leading-[1.5] text-mist">
              {station.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {station.genres.map((g) => (
              <span
                key={g}
                className="rounded-badges bg-white/[0.05] px-1.5 py-0 text-[12px] font-normal text-fog"
              >
                {g}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <PlayButton station={station} />
            {station.website && (
              <a
                href={station.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-buttons border border-graphite bg-transparent px-3 py-2 text-[13px] font-normal text-mist transition-colors hover:border-smoke hover:bg-white/[0.02]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Website
              </a>
            )}
            <LiveIndicator station={station} />
          </div>
        </div>
      </header>

      <section className="mt-12 rounded-cards border border-dashed border-graphite bg-carbon/50 p-8 text-center text-[13px] font-normal text-fog">
        Now Playing and playlist history will appear here when we add the
        database and metadata polling (Phase 2).
      </section>
    </main>
  );
}
