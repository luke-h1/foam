import { createSevenTvEmote } from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import {
  type EmoteReprocessInputs,
  MAX_FILTERED_EMOTE_NAMES,
  pickEmoteReprocessScope,
} from '@app/components/chat/util/pickEmoteReprocessScope';
import type { EnrichScope } from '@app/store/chat/actions/message-enrichment';
import {
  clearSevenTvEmoteDeltas,
  recordSevenTvEmoteDelta,
  type SevenTvEmoteDelta,
  takeSevenTvEmoteDelta,
} from '@app/store/chat/actions/seven-tv-emote-delta';

const kappa = createSevenTvEmote({ id: 'kappa', name: 'Kappa' });
const hype = createSevenTvEmote({ id: 'hype', name: 'Hype' });
const before = [kappa];
const after = [kappa, hype];
const bttvChannelEmotes: never[] = [];

function inputs(
  sevenTvChannelEmotes: typeof before,
  overrides: Partial<EmoteReprocessInputs> = {},
): EmoteReprocessInputs {
  return {
    channelId: 'channel-1',
    channelEmoteData: { sevenTvChannelEmotes, bttvChannelEmotes },
    emoteLoadStatus: 'success',
    show7TvEmotes: true,
    userLogin: 'me',
    ...overrides,
  };
}

function delta(names: string[]): SevenTvEmoteDelta {
  return { from: before, to: after, names: new Set(names) };
}

describe('pickEmoteReprocessScope', () => {
  test('filters by name when the delta is the only change since the last run', () => {
    expect(
      pickEmoteReprocessScope({
        delta: delta(['Hype']),
        previous: inputs(before),
        next: inputs(after),
        interruptedPass: null,
        processedSetCleared: false,
      }),
    ).toEqual<EnrichScope>({ kind: 'emoteNames', names: new Set(['Hype']) });
  });

  test('keeps the default pass when another slice also changed', () => {
    expect(
      pickEmoteReprocessScope({
        delta: delta(['Hype']),
        previous: inputs(before),
        next: {
          ...inputs(after),
          channelEmoteData: {
            sevenTvChannelEmotes: after,
            bttvChannelEmotes: [],
          },
        },
        interruptedPass: null,
        processedSetCleared: false,
      }),
    ).toEqual<EnrichScope>({ kind: 'unprocessed' });
  });

  test('keeps the default pass when the arrays do not match the delta', () => {
    expect(
      pickEmoteReprocessScope({
        delta: delta(['Hype']),
        previous: inputs([hype]),
        next: inputs(after),
        interruptedPass: null,
        processedSetCleared: false,
      }),
    ).toEqual<EnrichScope>({ kind: 'unprocessed' });
  });

  test('re-resolves every row when a delta interrupts a default pass', () => {
    expect(
      pickEmoteReprocessScope({
        delta: delta(['Hype']),
        previous: inputs(before),
        next: inputs(after),
        interruptedPass: 'unprocessed',
        processedSetCleared: false,
      }),
    ).toEqual<EnrichScope>({ kind: 'everyMessage' });
  });

  test('re-resolves every row when the run interrupts a narrowed pass', () => {
    expect(
      pickEmoteReprocessScope({
        delta: undefined,
        previous: inputs(after),
        next: inputs(after),
        interruptedPass: 'emoteNames',
        processedSetCleared: false,
      }),
    ).toEqual<EnrichScope>({ kind: 'everyMessage' });
  });

  test('keeps the default pass when the processed set was cleared', () => {
    expect(
      pickEmoteReprocessScope({
        delta: delta(['Hype']),
        previous: inputs(before),
        next: inputs(after),
        interruptedPass: 'everyMessage',
        processedSetCleared: true,
      }),
    ).toEqual<EnrichScope>({ kind: 'unprocessed' });
  });

  test('keeps the default pass when a reprocess input other than the emotes changed', () => {
    expect(
      pickEmoteReprocessScope({
        delta: delta(['Hype']),
        previous: inputs(before),
        next: inputs(after, { userLogin: 'someone-else' }),
        interruptedPass: null,
        processedSetCleared: false,
      }),
    ).toEqual<EnrichScope>({ kind: 'unprocessed' });
  });

  test('re-resolves every row when the delta names more emotes than the limit', () => {
    const names = Array.from(
      { length: MAX_FILTERED_EMOTE_NAMES + 1 },
      (_, index) => `Bulk${index}`,
    );

    expect(
      pickEmoteReprocessScope({
        delta: delta(names),
        previous: inputs(before),
        next: inputs(after),
        interruptedPass: null,
        processedSetCleared: false,
      }),
    ).toEqual<EnrichScope>({ kind: 'everyMessage' });
  });
});

describe('recordSevenTvEmoteDelta', () => {
  afterEach(clearSevenTvEmoteDeltas);

  test('merges back-to-back updates into one delta from the first array', () => {
    const last = [hype];

    recordSevenTvEmoteDelta('channel-1', before, after, [hype]);
    recordSevenTvEmoteDelta('channel-1', after, last, [kappa]);

    expect(takeSevenTvEmoteDelta('channel-1')).toEqual<SevenTvEmoteDelta>({
      from: before,
      to: last,
      names: new Set(['Hype', 'Kappa']),
    });
  });

  test('starts a new delta when the next update does not follow the last one', () => {
    recordSevenTvEmoteDelta('channel-1', before, after, [hype]);
    recordSevenTvEmoteDelta('channel-1', [hype], before, [kappa]);

    expect(takeSevenTvEmoteDelta('channel-1')).toEqual<SevenTvEmoteDelta>({
      from: [hype],
      to: before,
      names: new Set(['Kappa']),
    });
  });

  test('hands a delta out once', () => {
    recordSevenTvEmoteDelta('channel-1', before, after, [hype]);
    takeSevenTvEmoteDelta('channel-1');

    expect(takeSevenTvEmoteDelta('channel-1')).toBeUndefined();
  });
});
