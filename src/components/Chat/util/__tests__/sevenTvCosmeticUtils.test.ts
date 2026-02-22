import type { SevenTvHost } from '@app/services/seventv-service';
import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type {
  BadgeData,
  PaintData,
  PaintShadow,
  PaintStop,
} from '@app/utils/color/seventv-ws-service';
import {
  badgeUrlFromHost,
  get7TvCosmeticId,
  sanitise7TvBadge,
  toPaintWithId,
} from '../sevenTvCosmeticUtils';

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
    gradients: { length: 0 },
    shadows: emptyShadows,
    text: null,
    function: 'LINEAR_GRADIENT',
    repeat: false,
    angle: 0,
    shape: 'circle',
    image_url: '',
    stops: emptyStops,
    ...(overrides.ref_id !== undefined && { ref_id: overrides.ref_id }),
  };
}

describe('sevenTvCosmeticUtils', () => {
  describe('badgeUrlFromHost', () => {
    test('returns url with 4x file when present', () => {
      const host = makeSevenTvHost('https://cdn.7tv.app', [
        makeSevenTvFile('1x', 18, 18),
        makeSevenTvFile('2x', 36, 36),
        makeSevenTvFile('4x', 72, 72),
      ]);
      expect(badgeUrlFromHost(host)).toBe('https://cdn.7tv.app/4x');
    });

    test('falls back to 3x then 2x then 1x when 4x missing', () => {
      const host = makeSevenTvHost('https://cdn.7tv.app', [
        makeSevenTvFile('1x', 18, 18),
        makeSevenTvFile('2x', 36, 36),
        makeSevenTvFile('3x', 54, 54),
      ]);
      expect(badgeUrlFromHost(host)).toBe('https://cdn.7tv.app/3x');
    });

    test('falls back to last file then first when no 4x/3x/2x/1x', () => {
      const host = makeSevenTvHost('https://cdn.7tv.app', [
        makeSevenTvFile('tiny', 9, 9),
        makeSevenTvFile('small', 18, 18),
      ]);
      expect(badgeUrlFromHost(host)).toBe('https://cdn.7tv.app/small');
    });

    test('returns host url when files is empty', () => {
      const host = makeSevenTvHost('https://cdn.7tv.app', []);
      expect(badgeUrlFromHost(host)).toBe('https://cdn.7tv.app');
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
        host: makeSevenTvHost('https://cdn.7tv.app', [
          makeSevenTvFile('4x', 72, 72),
        ]),
      });
      const result = sanitise7TvBadge(badgeData);
      expect(result).toEqual({
        id: 'badge-id',
        url: 'https://cdn.7tv.app/4x',
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

  describe('toPaintWithId', () => {
    test('returns paint with same id when not zero', () => {
      const paint = makePaintData({
        id: 'paint-123',
        name: 'Paint',
        color: 0xff0000ff,
      });
      expect(toPaintWithId(paint)).toEqual({ ...paint, id: 'paint-123' });
    });

    test('returns paint with ref_id when id is zero', () => {
      const zeroId = '00000000000000000000000000';
      const paint = makePaintData({
        id: zeroId,
        ref_id: 'real-paint-id',
        name: 'Paint',
        color: 0x00ff00ff,
      });
      expect(toPaintWithId(paint)).toEqual({
        ...paint,
        id: 'real-paint-id',
      });
    });
  });
});
