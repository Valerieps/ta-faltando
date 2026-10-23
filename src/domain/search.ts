import type { Item } from './item';
import { nameKey } from './text';

/** Edit distance with transpositions ("cafe" → "caef" is 1), for typos in the autocomplete. */
export function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

/** Typos tolerated for a query of this length: none for very short ones. */
const tolerance = (length: number) => (length >= 6 ? 2 : length >= 3 ? 1 : 0);

/** How well an item name matches the query; lower is better, null is no match. */
function score(name: string, query: string): number | null {
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.split(' ').some((word) => word.startsWith(query))) return 2;
  if (name.includes(query)) return 3;
  const distance = Math.min(editDistance(query, name), editDistance(query, name.slice(0, query.length)));
  return distance <= tolerance(query.length) ? 3 + distance : null;
}

/**
 * The catalog items that match what is being typed, best first, tolerant to case, accents and
 * typos ("agua sanitaria" finds "Água sanitária"; spec/itens-e-contextos.md).
 */
export function searchItems(items: readonly Item[], query: string, limit = 5): Item[] {
  const key = nameKey(query);
  if (!key) return [];
  return items
    .filter((item) => item.deletedAt === null)
    .map((item) => ({ item, key: nameKey(item.name), score: score(nameKey(item.name), key) }))
    .filter((match): match is { item: Item; key: string; score: number } => match.score !== null)
    .sort((a, b) => a.score - b.score || a.key.length - b.key.length || a.key.localeCompare(b.key))
    .slice(0, limit)
    .map((match) => match.item);
}
