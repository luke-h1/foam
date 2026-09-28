import type { SevenTvHost } from '@app/types/seventv/emotes';

export function makeSevenTvFile(
  name: string,
  width = 0,
  height = 0,
): SevenTvHost['files'][number] {
  return {
    name,
    static_name: name,
    width,
    height,
    frame_count: 1,
    size: 0,
    format: 'png',
  };
}

export function makeSevenTvHost(
  url: string,
  files: SevenTvHost['files'][number][],
): SevenTvHost {
  return { url, files };
}
