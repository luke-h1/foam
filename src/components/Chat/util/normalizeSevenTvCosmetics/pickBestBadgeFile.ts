import type { SevenTvHost } from '@app/types/seventv/emotes';

const BADGE_SCALE_ORDER = ['4x', '3x', '2x', '1x'] as const;

function fileMatchesBadgeScale(
  file: SevenTvHost['files'][number],
  scale: (typeof BADGE_SCALE_ORDER)[number],
): boolean {
  return (
    file.name === scale ||
    file.name.startsWith(`${scale}.`) ||
    file.static_name === scale
  );
}

function indexBadgeFilesByScale(
  files: SevenTvHost['files'],
): Map<(typeof BADGE_SCALE_ORDER)[number], SevenTvHost['files'][number]> {
  const filesByScale = new Map<
    (typeof BADGE_SCALE_ORDER)[number],
    SevenTvHost['files'][number]
  >();

  for (const file of files) {
    for (const scale of BADGE_SCALE_ORDER) {
      if (fileMatchesBadgeScale(file, scale) && !filesByScale.has(scale)) {
        filesByScale.set(scale, file);
      }
    }
  }

  return filesByScale;
}

export function pickBestBadgeFile(
  files: SevenTvHost['files'] | undefined,
): SevenTvHost['files'][number] | undefined {
  if (!files?.length) {
    return undefined;
  }

  const filesByScale = indexBadgeFilesByScale(files);

  for (const scale of BADGE_SCALE_ORDER) {
    const match = filesByScale.get(scale);
    if (match) {
      return match;
    }
  }

  return files[files.length - 1] ?? files[0];
}
