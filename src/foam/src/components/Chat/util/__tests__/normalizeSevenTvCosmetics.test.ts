import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type {
  BadgeData,
  PaintData,
  PaintShadow,
  PaintStop,
} from '@app/types/seventv/cosmetics';
import type { SevenTvHost } from '@app/types/seventv/emotes';

import {
  badgeUrlFromHost,
  get7TvCosmeticId,
  normalizeSevenTvBadge,
  normalizeSevenTvPaint,
  sanitise7TvBadge,
  toPaintWithId,
} from '../normalizeSevenTvCosmetics';

const pickFields = (value: unknown, keys: readonly string[]) =>
  Object.fromEntries(
    keys.map(key => [key, (value as Record<string, unknown>)[key]]),
  );

function makeSevenTvFile(
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

function makeSevenTvHost(
  url: string,
  files: SevenTvHost['files'][number][],
): SevenTvHost {
  return { url, files };
}

function makeBadgeData(overrides: {
  id: string;
  name: string;
  tooltip: string;
  host: SevenTvHost;
  ref_id?: string;
}): BadgeData & { ref_id?: string } {
  return {
    id: overrides.id,
    name: overrides.name,
    tooltip: overrides.tooltip,
    host: overrides.host,
    ...(overrides.ref_id !== undefined && { ref_id: overrides.ref_id }),
  };
}

const emptyShadows: IndexedCollection<PaintShadow> = { length: 0 };
const emptyStops: IndexedCollection<PaintStop> = { length: 0 };

function makePaintData(overrides: {
  id: string;
  name: string;
  color: number | null;
  ref_id?: string;
}): PaintData & { ref_id?: string } {
  return {
    id: overrides.id,
    name: overrides.name,
    color: overrides.color,
    layers: { length: 0 },
    shadows: emptyShadows,
    textStyle: null,
    function: 'LINEAR_GRADIENT',
    repeat: false,
    angle: 0,
    shape: 'circle',
    image_url: '',
    stops: emptyStops,
    ...(overrides.ref_id !== undefined && { ref_id: overrides.ref_id }),
  };
}

describe('normalizeSevenTvCosmetics', () => {
  describe('badgeUrlFromHost', () => {
    test('returns url with 4x file when present', () => {
      const host = makeSevenTvHost('https://cdn.7tv.app/badge/badge-id', [
        makeSevenTvFile('1x', 18, 18),
        makeSevenTvFile('2x', 36, 36),
        makeSevenTvFile('4x', 72, 72),
      ]);
      expect(badgeUrlFromHost(host, 'badge-id')).toBe(
        'https://cdn.7tv.app/badge/badge-id/4x.png',
      );
    });

    test('falls back to 3x then 2x then 1x when 4x missing', () => {
      const host = makeSevenTvHost('https://cdn.7tv.app/badge/badge-id', [
        makeSevenTvFile('1x', 18, 18),
        makeSevenTvFile('2x', 36, 36),
        makeSevenTvFile('3x', 54, 54),
      ]);
      expect(badgeUrlFromHost(host, 'badge-id')).toBe(
        'https://cdn.7tv.app/badge/badge-id/3x.png',
      );
    });

    test('falls back to canonical CDN url when host has no files', () => {
      const host = makeSevenTvHost('https://cdn.7tv.app', []);
      expect(badgeUrlFromHost(host, 'badge-id')).toBe(
        'https://cdn.7tv.app/badge/badge-id/4x.webp',
      );
    });
  });

  describe('get7TvCosmeticId', () => {
    test('returns id when not zero', () => {
      expect(get7TvCosmeticId({ id: 'abc123' })).toBe('abc123');
      expect(get7TvCosmeticId({ id: 'abc123', ref_id: 'ref' })).toBe('abc123');
    });

    test('returns ref_id when id is zero string', () => {
      const zeroId = '00000000000000000000000000';
      expect(get7TvCosmeticId({ id: zeroId, ref_id: 'actual-id' })).toBe(
        'actual-id',
      );
    });

    test('returns id when id is zero but no ref_id', () => {
      const zeroId = '00000000000000000000000000';
      expect(get7TvCosmeticId({ id: zeroId })).toBe(zeroId);
    });
  });

  describe('sanitise7TvBadge', () => {
    test('returns SanitisedBadgeSet with correct shape', () => {
      const badgeData = makeBadgeData({
        id: 'badge-id',
        name: 'Test Badge',
        tooltip: 'Tooltip text',
        host: makeSevenTvHost('https://cdn.7tv.app/badge/badge-id', [
          makeSevenTvFile('4x', 72, 72),
        ]),
      });
      const result = sanitise7TvBadge(badgeData);
      expect(result).toEqual({
        id: 'badge-id',
        url: 'https://cdn.7tv.app/badge/badge-id/4x.png',
        type: '7TV Badge',
        title: 'Tooltip text',
        set: 'badge-id',
        provider: '7tv',
      });
    });

    test('uses name when tooltip is missing', () => {
      const badgeData = makeBadgeData({
        id: 'bid',
        name: 'Badge Name',
        tooltip: '',
        host: makeSevenTvHost('https://cdn.7tv.app', []),
      });
      const result = sanitise7TvBadge(badgeData);
      expect(result.title).toBe('Badge Name');
    });

    test('uses provided id override', () => {
      const badgeData = makeBadgeData({
        id: '00000000000000000000000000',
        ref_id: 'ref-id',
        name: 'Badge',
        tooltip: '',
        host: makeSevenTvHost('https://cdn.7tv.app', []),
      });
      const result = sanitise7TvBadge(badgeData, 'custom-id');
      expect(result.id).toBe('custom-id');
      expect(result.set).toBe('custom-id');
    });
  });

  describe('normalizeSevenTvBadge', () => {
    test('rewrites legacy websocket badge urls to canonical CDN urls', () => {
      expect(
        normalizeSevenTvBadge({
          id: 'badge-id',
          set: 'badge-id',
          type: '7TV Badge',
          title: 'Badge',
          url: 'https://cdn.7tv.app/badge-id/4x',
          provider: '7tv',
        }).url,
      ).toBe('https://cdn.7tv.app/badge/badge-id/4x.webp');
    });
  });

  describe('normalizeSevenTvPaint', () => {
    test('normalizes legacy flat paint fields', () => {
      const paint = normalizeSevenTvPaint({
        id: 'paint-v2',
        name: 'V2 Paint',
        color: 0xff0000ff,
        function: 'LINEAR_GRADIENT',
        angle: 45,
        repeat: true,
        shape: 'circle',
        image_url: '',
        stops: {
          0: { at: 0, color: 0xff0000ff },
          1: { at: 1, color: 0x0000ffff },
          length: 2,
        },
      });

      expect(
        pickFields(paint, ['id', 'function', 'angle', 'repeat', 'stops']),
      ).toEqual({
        id: 'paint-v2',
        function: 'LINEAR_GRADIENT',
        angle: 45,
        repeat: true,
        stops: {
          0: { at: 0, color: 0xff0000ff },
          1: { at: 1, color: 0x0000ffff },
          length: 2,
        },
      });
    });

    test('normalizes every gradients layer when gradients array is present', () => {
      const paint = normalizeSevenTvPaint({
        id: 'paint-v3',
        name: 'V3 Paint',
        color: null,
        gradients: [
          {
            function: 'RADIAL_GRADIENT',
            shape: 'ellipse',
            repeat: false,
            stops: [
              { at: 0, color: 0xffffffff },
              { at: 1, color: 0x000000ff },
            ],
          },
          {
            function: 'LINEAR_GRADIENT',
            angle: 90,
            repeat: false,
            stops: [{ at: 0, color: 0x12345678 }],
          },
        ],
      });

      expect(paint.function).toBe('RADIAL_GRADIENT');
      expect(paint.shape).toBe('ellipse');
      expect(paint.layers.length).toBe(2);
      expect(paint.layers[1]?.function).toBe('LINEAR_GRADIENT');
      expect(paint.stops).toEqual({
        0: { at: 0, color: 0xffffffff },
        1: { at: 1, color: 0x000000ff },
        length: 2,
      });
    });

    test('preserves all gradient layers', () => {
      const paint = normalizeSevenTvPaint({
        id: 'multi-layer',
        name: 'Multi',
        gradients: [
          {
            function: 'LINEAR_GRADIENT',
            angle: 0,
            repeat: false,
            stops: [{ at: 0, color: 0x111111ff }],
          },
          {
            function: 'URL',
            image_url: 'https://example.com/overlay.png',
            stops: [],
            canvas_repeat: 'repeat',
          },
        ],
      });

      expect(paint.layers.length).toBe(2);
      expect(paint.layers[1]?.function).toBe('URL');
      expect(paint.layers[1]?.repeat).toBe(true);
    });

    test('maps URL canvas_repeat to repeat flag', () => {
      const paint = normalizeSevenTvPaint({
        id: 'url-paint',
        name: 'URL Paint',
        gradients: [
          {
            function: 'URL',
            image_url: 'https://cdn.7tv.app/paint/test.webp',
            canvas_repeat: 'repeat',
            repeat: false,
            stops: [],
          },
        ],
      });

      expect(pickFields(paint, ['function', 'image_url', 'repeat'])).toEqual({
        function: 'URL',
        image_url: 'https://cdn.7tv.app/paint/test.webp',
        repeat: true,
      });
    });
  });

  describe('toPaintWithId', () => {
    test('returns normalized paint with same id when not zero', () => {
      const paint = makePaintData({
        id: 'paint-123',
        name: 'Paint',
        color: 0xff0000ff,
      });
      expect(toPaintWithId(paint).id).toBe('paint-123');
      expect(toPaintWithId(paint).name).toBe('Paint');
    });

    test('returns paint with ref_id when id is zero', () => {
      const zeroId = '00000000000000000000000000';
      const paint = makePaintData({
        id: zeroId,
        ref_id: 'real-paint-id',
        name: 'Paint',
        color: 0x00ff00ff,
      });
      expect(toPaintWithId(paint).id).toBe('real-paint-id');
    });
  });
});
