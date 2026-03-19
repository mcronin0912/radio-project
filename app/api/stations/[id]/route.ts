import { NextResponse } from "next/server";
import { getStationBySlug, getStationById } from "@/lib/stations";

export const dynamic = "force-dynamic";

// [id] can be either a slug or the numeric id (station-0, station-1, etc.)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const station = id.startsWith("station-")
      ? getStationById(id)
      : getStationBySlug(id);

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    return NextResponse.json(station);
  } catch (error) {
    console.error("GET /api/stations/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch station" },
      { status: 500 }
    );
  }
}
