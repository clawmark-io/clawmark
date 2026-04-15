type Matchable = {
  title: string;
  keywords: string[];
};

type ScoredItem<T> = {
  item: T;
  score: number;
};

export function fuzzyMatch<T extends Matchable>(
  items: T[],
  query: string
): T[] {
  if (!query.trim()) {
    return items;
  }

  const queryLower = query.toLowerCase();
  const scored: ScoredItem<T>[] = [];

  for (const item of items) {
    const titleLower = item.title.toLowerCase();
    const keywordsLower = item.keywords.join(' ').toLowerCase();

    // Exact title match (highest score)
    if (titleLower === queryLower) {
      scored.push({ item, score: 1000 });
      continue;
    }

    // Title starts with query
    if (titleLower.startsWith(queryLower)) {
      scored.push({ item, score: 500 });
      continue;
    }

    // Title contains query
    if (titleLower.includes(queryLower)) {
      scored.push({ item, score: 250 });
      continue;
    }

    // Keywords contain query
    if (keywordsLower.includes(queryLower)) {
      scored.push({ item, score: 100 });
      continue;
    }

    // Fuzzy match (characters appear in order)
    let queryIdx = 0;
    let titleIdx = 0;
    while (queryIdx < query.length && titleIdx < titleLower.length) {
      if (queryLower[queryIdx] === titleLower[titleIdx]) {
        queryIdx++;
      }
      titleIdx++;
    }
    if (queryIdx === query.length) {
      scored.push({ item, score: 50 });
    }
  }

  return scored
    .toSorted((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
