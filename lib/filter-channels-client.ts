/**
 * Client-side filter logic for TV channels
 */

import type { ChannelRow } from "@/lib/channels";
import { formatChannelCategoryLabel } from "@/lib/channel-categories";

export type { ChannelRow };

export function filterChannelsClient(
  channels: ChannelRow[],
  options: {
    search?: string;
    category?: string;
    network?: string;
    state?: string;
  }
): ChannelRow[] {
  let result = [...channels];

  if (options.category) {
    const cat = options.category.toLowerCase();
    result = result.filter((c) =>
      c.categories.some((g) => g.toLowerCase() === cat)
    );
  }

  if (options.network) {
    const net = options.network.toLowerCase();
    if (net === "independent") {
      result = result.filter((c) => !c.network);
    } else {
      result = result.filter(
        (c) => (c.network ?? "").toLowerCase() === net
      );
    }
  }

  // Selected state includes national (no state) channels.
  if (options.state) {
    result = result.filter(
      (c) => !c.state || c.state === options.state
    );
  }

  if (options.search?.trim()) {
    const term = options.search.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.network ?? "").toLowerCase().includes(term) ||
        (c.state ?? "").toLowerCase().includes(term) ||
        (c.label ?? "").toLowerCase().includes(term) ||
        c.categories.some((g) => g.toLowerCase().includes(term))
    );
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export function formatCategoryLabel(value: string): string {
  return formatChannelCategoryLabel(value);
}

export function getFilterOptionsFromChannels(channels: ChannelRow[]): {
  categories: string[];
  networks: string[];
  states: string[];
} {
  const categoryCounts: Record<string, number> = {};
  const networkCounts: Record<string, number> = {};
  const stateCounts: Record<string, number> = {};

  for (const c of channels) {
    for (const cat of c.categories) {
      const key = cat.trim().toLowerCase();
      if (key) categoryCounts[key] = (categoryCounts[key] || 0) + 1;
    }
    const net = (c.network ?? "Independent").trim();
    if (net) networkCounts[net] = (networkCounts[net] || 0) + 1;
    if (c.state) stateCounts[c.state] = (stateCounts[c.state] || 0) + 1;
  }

  const categoryOrder = [
    "news",
    "sports",
    "kids",
    "movies",
    "drama",
    "comedy",
    "lifestyle",
    "factual",
    "music",
    "shopping",
    "entertainment",
    "general",
  ];
  const categories = Object.keys(categoryCounts).sort(
    (a, b) =>
      (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
        (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b)) ||
      a.localeCompare(b)
  );

  const networks = Object.entries(networkCounts)
    .sort((a, b) => {
      if (a[0] === "Independent") return 1;
      if (b[0] === "Independent") return -1;
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    })
    .map(([n]) => n);

  const stateOrder = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
  const states = Object.keys(stateCounts).sort(
    (a, b) =>
      (stateOrder.indexOf(a) === -1 ? 99 : stateOrder.indexOf(a)) -
        (stateOrder.indexOf(b) === -1 ? 99 : stateOrder.indexOf(b)) ||
      a.localeCompare(b)
  );

  return { categories, networks, states };
}
