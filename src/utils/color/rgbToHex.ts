export function rgbToHex(rgb: string): string {
  if (rgb.startsWith('rgb(') && rgb.endsWith(')')) {
    rgb = rgb.replace('rgb(', '').replace(')', '');

    const [r, g, b] = rgb.split(',').map(value => {
      const num = parseInt(value.trim(), 10);
      return Number.isNaN(num) ? 255 : num;
    });

    return `#${[r, g, b].map(x => x?.toString(16).padStart(2, '0')).join('')}`;
  }
  return rgb;
}
