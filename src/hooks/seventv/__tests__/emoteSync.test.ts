import { EmoteSetKind } from '@app/graphql/generated/gql';

import {
  type EmoteSyncDeps,
  handleEmoteSetUpdate,
  HISTORICAL_EVENT_BUFFER,
  isActiveEmoteSetUpdate,
} from '../emoteSync';
import {
  createEmoteSetUpdateEvent,
  createPulledChange,
  createPushedChange,
  createSevenTvEmote,
  createSevenTvFile,
  createStvActor,
  createUpdatedChange,
} from './__fixtures__/emoteSync.fixture';

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    stvWs: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

function createDeps(overrides: Partial<EmoteSyncDeps> = {}): EmoteSyncDeps {
  return {
    expectedEmoteSetId: 'set-1',
    connectionTimestamp: null,
    channelId: '12345',
    onEmoteUpdate: jest.fn(),
    ...overrides,
  };
}

describe('handleEmoteSetUpdate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('emits the old emote as removed and the new emote as added for an in-place update', () => {
    const actor = createStvActor();
    const oldEmote = createSevenTvEmote({
      id: 'emote-1',
      name: 'OldPeepo',
      originalName: 'peepoHappy',
    });
    const newEmote = createSevenTvEmote({
      id: 'emote-1',
      name: 'NewPeepo',
      originalName: 'peepoHappy',
    });
    const event = createEmoteSetUpdateEvent({
      id: 'set-1',
      actor,
      updated: [createUpdatedChange(oldEmote, newEmote)],
    });
    const onEmoteUpdate = jest.fn();
    const deps = createDeps({
      connectionTimestamp: Date.now() - HISTORICAL_EVENT_BUFFER,
      onEmoteUpdate,
    });

    handleEmoteSetUpdate(event, deps);

    expect(onEmoteUpdate).toHaveBeenCalledTimes(1);
    expect(onEmoteUpdate.mock.calls[0]?.[0]).toEqual({
      added: [
        {
          name: 'NewPeepo',
          id: 'emote-1',
          url: 'https://cdn.7tv.app/emote/emote-1/4x.avif',
          original_name: 'peepoHappy',
          creator: 'EmoteAuthor',
          emote_link: 'https://7tv.app/emotes/emote-1',
          site: '7TV Channel',
          frame_count: 60,
          format: 'AVIF',
          flags: 0,
          aspect_ratio: 1,
          zero_width: false,
          width: 128,
          height: 128,
          set_metadata: {
            setId: '',
            setName: '',
            capacity: null,
            ownerId: null,
            kind: EmoteSetKind.Normal,
            updatedAt: '2025-06-01T12:00:00.000Z',
            totalCount: 0,
          },
          actor,
        },
      ],
      removed: [
        {
          name: 'OldPeepo',
          id: 'emote-1',
          url: 'https://cdn.7tv.app/emote/emote-1/4x.avif',
          original_name: 'peepoHappy',
          creator: 'EmoteAuthor',
          emote_link: 'https://7tv.app/emotes/emote-1',
          site: '7TV Channel',
          frame_count: 60,
          format: 'AVIF',
          flags: 0,
          aspect_ratio: 1,
          zero_width: false,
          width: 128,
          height: 128,
          set_metadata: {
            setId: '',
            setName: '',
            capacity: null,
            ownerId: null,
            kind: EmoteSetKind.Normal,
            updatedAt: '2025-06-01T12:00:00.000Z',
            totalCount: 0,
          },
          actor,
        },
      ],
      channelId: '12345',
    });
  });

  test('emits pushed emotes as added and pulled emotes as removed, picking the best available file', () => {
    const actor = createStvActor();
    const zeroWidthEmote = createSevenTvEmote({
      id: 'emote-zw',
      name: 'SoSnowy',
      flags: 256,
      files: [
        createSevenTvFile({ name: '1x.avif', width: 32, height: 32 }),
        createSevenTvFile({
          name: '2x.avif',
          width: 64,
          height: 32,
          frame_count: 12,
        }),
      ],
    });
    const removedEmote = createSevenTvEmote({
      id: 'emote-old',
      name: 'FeelsBadMan',
    });
    const event = createEmoteSetUpdateEvent({
      id: 'set-1',
      actor,
      pushed: [createPushedChange(zeroWidthEmote)],
      pulled: [createPulledChange(removedEmote)],
    });
    const onEmoteUpdate = jest.fn();
    const deps = createDeps({ onEmoteUpdate });

    handleEmoteSetUpdate(event, deps);

    expect(onEmoteUpdate).toHaveBeenCalledTimes(1);
    expect(onEmoteUpdate.mock.calls[0]?.[0]).toEqual({
      added: [
        {
          name: 'SoSnowy',
          id: 'emote-zw',
          url: 'https://cdn.7tv.app/emote/emote-zw/2x.avif',
          original_name: 'SoSnowy',
          creator: 'EmoteAuthor',
          emote_link: 'https://7tv.app/emotes/emote-zw',
          site: '7TV Channel',
          frame_count: 12,
          format: 'AVIF',
          flags: 256,
          aspect_ratio: 2,
          zero_width: true,
          width: 64,
          height: 32,
          set_metadata: {
            setId: '',
            setName: '',
            capacity: null,
            ownerId: null,
            kind: EmoteSetKind.Normal,
            updatedAt: '2025-06-01T12:00:00.000Z',
            totalCount: 0,
          },
          actor,
        },
      ],
      removed: [
        {
          name: 'FeelsBadMan',
          id: 'emote-old',
          url: 'https://cdn.7tv.app/emote/emote-old/4x.avif',
          original_name: 'FeelsBadMan',
          creator: 'EmoteAuthor',
          emote_link: 'https://7tv.app/emotes/emote-old',
          site: '7TV Channel',
          frame_count: 60,
          format: 'AVIF',
          flags: 0,
          aspect_ratio: 1,
          zero_width: false,
          width: 128,
          height: 128,
          set_metadata: {
            setId: '',
            setName: '',
            capacity: null,
            ownerId: null,
            kind: EmoteSetKind.Normal,
            updatedAt: '2025-06-01T12:00:00.000Z',
            totalCount: 0,
          },
          actor,
        },
      ],
      channelId: '12345',
    });
  });

  test('ignores updates for a different emote set', () => {
    const event = createEmoteSetUpdateEvent({
      id: 'other-set',
      pushed: [
        createPushedChange(
          createSevenTvEmote({ id: 'emote-1', name: 'peepoHappy' }),
        ),
      ],
    });
    const onEmoteUpdate = jest.fn();
    const deps = createDeps({ onEmoteUpdate });

    handleEmoteSetUpdate(event, deps);

    expect(onEmoteUpdate).not.toHaveBeenCalled();
  });

  test('ignores updates that arrive within the historical event buffer', () => {
    const event = createEmoteSetUpdateEvent({
      id: 'set-1',
      pushed: [
        createPushedChange(
          createSevenTvEmote({ id: 'emote-1', name: 'peepoHappy' }),
        ),
      ],
    });
    const onEmoteUpdate = jest.fn();
    const deps = createDeps({
      connectionTimestamp: Date.now() - 5000,
      onEmoteUpdate,
    });

    handleEmoteSetUpdate(event, deps);

    expect(onEmoteUpdate).not.toHaveBeenCalled();
  });

  test('does not invoke the callback when the update contains no emote changes', () => {
    const event = createEmoteSetUpdateEvent({ id: 'set-1' });
    const onEmoteUpdate = jest.fn();
    const deps = createDeps({ onEmoteUpdate });

    handleEmoteSetUpdate(event, deps);

    expect(onEmoteUpdate).not.toHaveBeenCalled();
  });
});

describe('isActiveEmoteSetUpdate', () => {
  test('returns true when the event matches the expected emote set', () => {
    const event = createEmoteSetUpdateEvent({ id: 'set-1' });

    expect(isActiveEmoteSetUpdate(event, 'set-1')).toBe(true);
  });

  test('returns false when no expected emote set is known', () => {
    const event = createEmoteSetUpdateEvent({ id: 'set-1' });

    expect(isActiveEmoteSetUpdate(event, undefined)).toBe(false);
  });

  test('returns false when the event targets another emote set', () => {
    const event = createEmoteSetUpdateEvent({ id: 'other-set' });

    expect(isActiveEmoteSetUpdate(event, 'set-1')).toBe(false);
  });
});
