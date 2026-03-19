import { NextResponse } from "next/server";
import { filterStations } from "@/lib/stations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre");
    const search = searchParams.get("search") ?? searchParams.get("q");
    const state = searchParams.get("state");
    const indigenous = searchParams.get("indigenous") === "1";

    const stations = filterStations({
      genre: genre ?? undefined,
      search: search ?? undefined,
      state: state ?? undefined,
      indigenous,
    });

    return NextResponse.json(stations);
  } catch (error) {
    console.error("GET /api/stations:", error);
    return NextResponse.json(
      { error: "Failed to fetch stations" },
      { status: 500 }
    );
  }
}
