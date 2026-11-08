export function chunk<TItem>(items: readonly TItem[], size: number): TItem[][] {
  const chunks: TItem[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}
