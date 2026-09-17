/**
 * TV channel genre categories (not networks).
 * Used by the fetch script (via duplicate JS) and the client enricher.
 */

export const CHANNEL_CATEGORY_LABELS: Record<string, string> = {
  news: "News",
  sports: "Sports",
  kids: "Kids",
  movies: "Movies",
  drama: "Drama",
  comedy: "Comedy",
  lifestyle: "Lifestyle",
  factual: "Factual",
  music: "Music",
  shopping: "Shopping",
  entertainment: "Entertainment",
  general: "General",
};

const EPG_CATEGORY_MAP: Record<string, string> = {
  news: "news",
  sports: "sports",
  sport: "sports",
  "kids & family": "kids",
  kids: "kids",
  family: "kids",
  comedy: "comedy",
  drama: "drama",
  "action & adventure": "movies",
  movies: "movies",
  movie: "movies",
  film: "movies",
  "special interest": "factual",
  documentary: "factual",
  factual: "factual",
  lifestyle: "lifestyle",
  food: "lifestyle",
  cooking: "lifestyle",
  music: "music",
  shopping: "shopping",
  entertainment: "entertainment",
};

/** Map a Freeview/XMLTV programme category string to our taxonomy. */
export function normalizeProgrammeCategory(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  if (EPG_CATEGORY_MAP[key]) return EPG_CATEGORY_MAP[key];
  for (const [needle, cat] of Object.entries(EPG_CATEGORY_MAP)) {
    if (key.includes(needle)) return cat;
  }
  return null;
}

/** Infer genres from channel name / network when EPG is thin. */
export function inferCategoriesFromChannel(
  name: string,
  network?: string | null
): string[] {
  const text = `${name} ${network ?? ""}`.toLowerCase();
  const found = new Set<string>();

  if (
    /\bnews\b|euronews|\bcna\b|sky news|ticker|briefing|al jazeera|france 24|\bdw\b|bloomberg/.test(
      text
    )
  ) {
    found.add("news");
  }
  if (
    /\bsport|racing|thoroughbred|cricket|fifa|nrl|afl|rugby|wnbl|qrl|knockout|olymp/.test(
      text
    )
  ) {
    found.add("sports");
  }
  if (
    /\bkids\b|nick|nickelodeon|cartoon|abc kids|abc family|spongebob|preschool/.test(
      text
    )
  ) {
    found.add("kids");
  }
  if (/\bmovie|cinema|thriller movies|world movies|film/.test(text)) {
    found.add("movies");
  }
  if (/\bcomedy\b/.test(text)) found.add("comedy");
  if (/\bdrama\b|crime|mystery|paranormal/.test(text)) found.add("drama");
  if (
    /\bfood\b|cooking|lifestyle|home.?garden|garden|real estate|the block|married/.test(
      text
    )
  ) {
    found.add("lifestyle");
  }
  if (/\bmusic\b|\bmtv\b|folk klub|chill|popasia/.test(text)) {
    found.add("music");
  }
  if (/\bshop|tvsn|expo channel/.test(text)) found.add("shopping");
  if (/\bweather\b/.test(text)) found.add("factual");
  if (/\bdocu|factual|insight|dateline|hard quiz|7\.30|back roads/.test(text)) {
    found.add("factual");
  }

  // Main FTA banners
  if (
    /^(abc tv|seven|channel 9|10|sbs|nitv)(\s|$)/i.test(name.trim()) ||
    /\b(7two|7mate|7flix|9gem|9go|9life|9rush|10 bold|10 peach|sbs food|sbs viceland|sbs worldwatch)\b/i.test(
      name
    )
  ) {
    found.add("general");
  }

  if (found.size === 0) {
    if (/^(ten|nine|seven|abc|sbs)$/i.test((network ?? "").trim())) {
      found.add("entertainment");
    } else {
      found.add("entertainment");
    }
  }

  return Array.from(found);
}

/**
 * Merge name heuristics with EPG programme category votes.
 * EPG signal wins ordering when present.
 */
export function resolveChannelCategories(options: {
  name: string;
  network?: string | null;
  programmeCategories?: Array<string | null | undefined>;
}): string[] {
  const votes = new Map<string, number>();
  for (const raw of options.programmeCategories ?? []) {
    const cat = normalizeProgrammeCategory(raw);
    if (!cat) continue;
    votes.set(cat, (votes.get(cat) || 0) + 1);
  }

  const fromEpg = Array.from(votes.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([c]) => c);

  const fromName = inferCategoriesFromChannel(
    options.name,
    options.network
  );

  const merged: string[] = [];
  for (const c of [...fromEpg, ...fromName]) {
    if (!merged.includes(c)) merged.push(c);
  }
  return merged.slice(0, 4);
}

export function formatChannelCategoryLabel(value: string): string {
  const key = value.trim().toLowerCase();
  return CHANNEL_CATEGORY_LABELS[key] ?? value.charAt(0).toUpperCase() + value.slice(1);
}
