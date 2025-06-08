export function isSingleChannel(r: number, g: number, b: number): boolean {
  return [r, g, b].filter(value => value > 0).length === 1;
}
