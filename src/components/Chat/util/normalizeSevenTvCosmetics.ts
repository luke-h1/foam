import type { SevenTvHost } from '@app/services/seventv-service';
import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type {
  BadgeData,
  PaintCanvasRepeat,
  PaintData,
  PaintFunction,
  PaintLayerData,
  PaintShadow,
  PaintShape,
  PaintStop,
  PaintTextStyle,
} from '@app/utils/color/seventv-ws-service';

const ZERO_ID = '00000000000000000000000000';
const SEVEN_TV_BADGE_CDN_BASE = 'https://cdn.7tv.app/badge';

function badgeFileName(file: SevenTvHost['files'][number]): string {
  if (/\.(webp|png|avif|gif|jpe?g)$/i.test(file.name)) {
    return file.name;
  }

  const format = file.format?.replace(/^\./, '') || 'webp';
  return `${file.name}.${format}`;
}

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

function pickBestBadgeFile(
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

  return files.at(-1) ?? files[0];
}

export function buildSevenTvBadgeImageUrl(
  badgeId: string,
  host?: SevenTvHost,
): string {
  const file = pickBestBadgeFile(host?.files);
  if (file && host?.url) {
    return `${host.url.replace(/\/$/, '')}/${badgeFileName(file)}`;
  }

  return `${SEVEN_TV_BADGE_CDN_BASE}/${badgeId}/4x.webp`;
}

export function badgeUrlFromHost(host: SevenTvHost, badgeId?: string): string {
  if (badgeId) {
    return buildSevenTvBadgeImageUrl(badgeId, host);
  }

  const file = pickBestBadgeFile(host.files);
  if (file && host.url) {
    return `${host.url.replace(/\/$/, '')}/${badgeFileName(file)}`;
  }

  return host.url;
}

export function get7TvCosmeticId(
  data: { id: string } & { ref_id?: string },
): string {
  return data.id === ZERO_ID && data.ref_id ? data.ref_id : data.id;
}

export function isSevenTvBadge(badge: SanitisedBadgeSet): boolean {
  return badge.provider === '7tv' || badge.type === '7TV Badge';
}

export function normalizeSevenTvBadge(
  badge: SanitisedBadgeSet,
): SanitisedBadgeSet {
  if (!isSevenTvBadge(badge) || !badge.id) {
    return badge;
  }

  if (
    badge.url.includes('/badge/') &&
    /\.(webp|png|avif|gif|jpe?g)(?:$|\?)/i.test(badge.url)
  ) {
    return badge;
  }

  return {
    ...badge,
    url: buildSevenTvBadgeImageUrl(badge.id),
  };
}

export function sanitise7TvBadge(
  badgeData: BadgeData & { ref_id?: string },
  id?: string,
): SanitisedBadgeSet {
  const badgeId = id ?? get7TvCosmeticId(badgeData);
  return normalizeSevenTvBadge({
    id: badgeId,
    url: badgeUrlFromHost(badgeData.host, badgeId),
    type: '7TV Badge' as const,
    title: badgeData.tooltip || badgeData.name,
    set: badgeId,
    provider: '7tv',
  });
}

export type PaintGradientLayer = {
  function: PaintFunction;
  canvas_repeat?: string;
  size?: [number, number] | null;
  at?: [number, number];
  stops?: IndexedCollection<PaintStop> | PaintStop[];
  image_url?: string;
  shape?: string;
  angle?: number;
  repeat?: boolean;
};

export type RawSevenTvPaintInput = Partial<PaintData> & {
  id: string;
  ref_id?: string;
  gradients?: PaintGradientLayer[];
};

function isPaintGradientArray(
  gradients: RawSevenTvPaintInput['gradients'],
): gradients is PaintGradientLayer[] {
  return Array.isArray(gradients) && gradients.length > 0;
}

function stopsToIndexed(
  stops: IndexedCollection<PaintStop> | PaintStop[] | undefined,
): IndexedCollection<PaintStop> {
  if (!stops) {
    return { length: 0 };
  }

  if (Array.isArray(stops)) {
    const indexed: IndexedCollection<PaintStop> = { length: stops.length };
    stops.forEach((stop, index) => {
      indexed[index] = stop;
    });
    return indexed;
  }

  return stops;
}

function canvasRepeatToRepeat(canvasRepeat?: string): boolean {
  if (
    !canvasRepeat ||
    canvasRepeat === 'unset' ||
    canvasRepeat === 'no-repeat'
  ) {
    return false;
  }

  return true;
}

const PAINT_CANVAS_REPEAT_VALUES = new Set<PaintCanvasRepeat>([
  '',
  'no-repeat',
  'repeat',
  'repeat-x',
  'repeat-y',
  'round',
  'space',
  'revert',
  'unset',
]);

function isPaintCanvasRepeat(value: string): value is PaintCanvasRepeat {
  return PAINT_CANVAS_REPEAT_VALUES.has(value as PaintCanvasRepeat);
}

function normalizeCanvasRepeat(canvasRepeat?: string): PaintCanvasRepeat {
  if (!canvasRepeat || !isPaintCanvasRepeat(canvasRepeat)) {
    return 'unset';
  }

  return canvasRepeat;
}

function normalizePaintLayer(layer: PaintGradientLayer): PaintLayerData {
  const shape: PaintShape = layer.shape === 'ellipse' ? 'ellipse' : 'circle';
  const repeat =
    layer.function === 'URL'
      ? canvasRepeatToRepeat(layer.canvas_repeat)
      : (layer.repeat ?? false);

  return {
    function: layer.function,
    stops: stopsToIndexed(layer.stops),
    angle: layer.angle ?? 0,
    shape,
    repeat,
    image_url: layer.image_url ?? '',
    canvas_repeat: normalizeCanvasRepeat(layer.canvas_repeat),
    at: layer.at?.length === 2 ? [layer.at[0], layer.at[1]] : null,
    size: layer.size?.length === 2 ? [layer.size[0], layer.size[1]] : null,
  };
}

function layersToIndexed(
  layers: PaintGradientLayer[],
): IndexedCollection<PaintLayerData> {
  const indexed: IndexedCollection<PaintLayerData> = { length: layers.length };
  layers.forEach((layer, index) => {
    indexed[index] = normalizePaintLayer(layer);
  });
  return indexed;
}

function parsePaintTextStyle(text: unknown): PaintTextStyle | null {
  if (!text || typeof text !== 'object') {
    return null;
  }

  const value = text as Record<string, unknown>;
  const style: PaintTextStyle = {};

  if (typeof value.weight === 'number') {
    style.weight = value.weight;
  }

  if (value.transform === 'uppercase' || value.transform === 'lowercase') {
    style.transform = value.transform;
  }

  if (value.stroke && typeof value.stroke === 'object') {
    const stroke = value.stroke as Record<string, unknown>;
    if (typeof stroke.color === 'number' && typeof stroke.width === 'number') {
      style.stroke = { color: stroke.color, width: stroke.width };
    }
  }

  if (value.shadows) {
    if (Array.isArray(value.shadows)) {
      const shadows: IndexedCollection<PaintShadow> = {
        length: value.shadows.length,
      };
      value.shadows.forEach((shadow, index) => {
        if (shadow && typeof shadow === 'object') {
          const entry = shadow as Record<string, unknown>;
          shadows[index] = {
            color: entry.color as number,
            radius: (entry.radius as number) ?? 0,
            x_offset: (entry.x_offset as number) ?? 0,
            y_offset: (entry.y_offset as number) ?? 0,
          };
        }
      });
      style.shadows = shadows;
    } else if (typeof value.shadows === 'object') {
      style.shadows = value.shadows as IndexedCollection<PaintShadow>;
    }
  }

  return Object.keys(style).length > 0 ? style : null;
}

function syncFlatFieldsFromLayer(
  layer: PaintLayerData,
): Pick<
  PaintData,
  'function' | 'repeat' | 'angle' | 'shape' | 'image_url' | 'stops'
> {
  return {
    function: layer.function,
    repeat: layer.repeat,
    angle: layer.angle,
    shape: layer.shape,
    image_url: layer.image_url,
    stops: layer.stops,
  };
}

export function normalizeSevenTvPaint(raw: RawSevenTvPaintInput): PaintData {
  const id = get7TvCosmeticId(raw);
  const textStyle =
    parsePaintTextStyle(raw.textStyle ?? (raw as { text?: unknown }).text) ??
    null;

  let sourceLayers: PaintGradientLayer[] = [];

  if (isPaintGradientArray(raw.gradients)) {
    sourceLayers = raw.gradients;
  } else if (raw.function) {
    sourceLayers = [
      {
        function: raw.function,
        canvas_repeat: '',
        size: [1, 1],
        shape: raw.shape,
        image_url: raw.image_url,
        stops: raw.stops,
        repeat: raw.repeat ?? false,
        angle: raw.angle,
      },
    ];
  } else if (raw.layers && raw.layers.length > 0) {
    return {
      id,
      name: raw.name ?? '',
      color: raw.color ?? null,
      layers: raw.layers,
      shadows: raw.shadows ?? { length: 0 },
      textStyle,
      function: raw.function ?? 'LINEAR_GRADIENT',
      repeat: raw.repeat ?? false,
      angle: raw.angle ?? 0,
      shape: raw.shape ?? 'circle',
      image_url: raw.image_url ?? '',
      stops: raw.stops ?? { length: 0 },
    };
  }

  if (sourceLayers.length === 0) {
    return {
      id,
      name: raw.name ?? '',
      color: raw.color ?? null,
      layers: { length: 0 },
      shadows: raw.shadows ?? { length: 0 },
      textStyle,
      function: 'LINEAR_GRADIENT',
      repeat: false,
      angle: 0,
      shape: 'circle',
      image_url: '',
      stops: { length: 0 },
    };
  }

  const layers = layersToIndexed(sourceLayers);
  const primary = layers[0];
  const flat = primary
    ? syncFlatFieldsFromLayer(primary)
    : {
        function: 'LINEAR_GRADIENT' as PaintFunction,
        repeat: false,
        angle: 0,
        shape: 'circle' as PaintShape,
        image_url: '',
        stops: { length: 0 } as IndexedCollection<PaintStop>,
      };

  return {
    id,
    name: raw.name ?? '',
    color: raw.color ?? null,
    layers,
    shadows: raw.shadows ?? { length: 0 },
    textStyle,
    ...flat,
  };
}

export function toPaintWithId(paintData: RawSevenTvPaintInput): PaintData {
  return normalizeSevenTvPaint(paintData);
}
