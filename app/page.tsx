import { getFilterOptions } from "@/lib/stations";
import { HomeShell } from "@/components/HomeShell";

export const metadata = {
  title: "Radio Project",
  description:
    "Discover Australian radio and TV — live streams in one place",
};

export default function HomePage() {
  const { states, genres } = getFilterOptions();

  return <HomeShell states={states} genres={genres} />;
}
