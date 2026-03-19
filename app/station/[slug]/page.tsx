import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getStationBySlug, getStations } from "@/lib/stations";
import { ExternalLink, Radio } from "lucide-react";
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
    title: `${station.name} — Community Radio Hub`,
    description: station.description ?? `Listen to ${station.name} from ${station.city}, ${station.state}`,
  };
}

export default async function StationPage({ params }: PageProps) {
  const { slug } = await params;

  const station = getStationBySlug(slug);

  if (!station) notFound();

  return (
    <main className="container mx-auto px-4 py-8 pb-24">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to directory
      </Link>

      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-muted">
          {station.logoUrl ? (
            <Image
              src={station.logoUrl}
              alt=""
              width={96}
              height={96}
              className="rounded-xl object-cover"
            />
          ) : (
            <Radio className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{station.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {station.callsign} · {station.city}, {station.state}
            {station.frequency && ` · ${station.frequency}`}
          </p>
          {station.description && (
            <p className="mt-4 text-muted-foreground">{station.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {station.genres.map((g) => (
              <span
                key={g}
                className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
              >
                {g}
              </span>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <PlayButton station={station} />
            {station.website && (
              <a
                href={station.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-input bg-background px-2.5 text-sm font-medium hover:bg-muted"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Website
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Now Playing and playlist history will appear here when we add the
        database and metadata polling (Phase 2).
      </section>
    </main>
  );
}
