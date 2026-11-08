export function appendWithSpace(current: string, addition: string): string {
  if (!current.trim()) {
    return `${addition} `;
  }

  const separator = current.endsWith(' ') ? '' : ' ';

  return `${current}${separator}${addition} `;
}
