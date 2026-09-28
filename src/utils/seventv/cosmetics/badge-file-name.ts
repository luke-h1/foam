import type { SevenTvHost } from '@app/types/seventv/emotes';

export function badgeFileName(file: SevenTvHost['files'][number]): string {
  if (/\.(webp|png|avif|gif|jpe?g)$/i.test(file.name)) {
    return file.name;
  }

  const format = file.format?.replace(/^\./, '') || 'webp';
  return `${file.name}.${format}`;
}
