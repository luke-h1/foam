import { EmoteSetKind } from '@app/graphql/generated/gql';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import type { SanitisedEmote, SevenTvSanitisedEmote } from '@app/types/emote';

import { processEmotesWorklet } from '../emoteProcessor';
import type { ParsedPart } from '../parsedPart';
import { replaceTextWithEmotes } from '../replaceTextWithEmotes/replaceTextWithEmotes';

/**
 * The live-ingest pipeline (`processEmotesWorklet`) and the preview pipeline
 * (`replaceTextWithEmotes`) are two implementations of one concept - "resolve
 * this text against the channel's emotes" - and their matching semantics have
 * drifted. This suite pins the CURRENT divergences so any consolidation (or
 * any further silent drift) fails a test and has to be decided consciously.
 * Which behaviour is correct per surface is a product decision, recorded in
 * the review; these tests document, they do not endorse.
 */

const baseEmote = (overrides: {
  id: string;
  name: string;
  original_name?: string;
  zero_width?: boolean;
  flags?: number;
}): SevenTvSanitisedEmote => ({
  id: overrides.id,
  name: overrides.name,
  original_name: overrides.original_name ?? overrides.name,
  creator: null,
  emote_link: `https://example.com/${overrides.id}`,
  site: '7TV Channel',
  provider: '7tv',
  url: `https://example.com/${overrides.id}.avif`,
  frame_count: 1,
  format: 'avif',
  flags: overrides.flags ?? 0,
  aspect_ratio: 1,
  zero_width: overrides.zero_width ?? false,
  width: 32,
  height: 32,
  set_metadata: {
    setId: 'set-id',
    setName: 'Channel',
    capacity: null,
    ownerId: null,
    kind: EmoteSetKind.Normal,
    updatedAt: '2026-05-11T00:00:00.000Z',
    totalCount: 1,
  },
});

const kappa = baseEmote({ id: 'kappa-id', name: 'Kappa' });
const overlay = baseEmote({
  id: 'overlay-id',
  name: 'Overlay',
  zero_width: true,
  flags: 256,
});
const renamed = baseEmote({
  id: 'renamed-id',
  name: 'NewName',
  original_name: 'OldName',
});

const emptySets = {
  sevenTvGlobalEmotes: [] as SanitisedEmote[],
  twitchGlobalEmotes: [] as SanitisedEmote[],
  twitchChannelEmotes: [] as SanitisedEmote[],
  ffzChannelEmotes: [] as SanitisedEmote[],
  ffzGlobalEmotes: [] as SanitisedEmote[],
  bttvChannelEmotes: [] as SanitisedEmote[],
  bttvGlobalEmotes: [] as SanitisedEmote[],
};

function liveParts(
  inputString: string,
  sevenTvChannelEmotes: SanitisedEmote[],
): ParsedPart[] {
  return processEmotesWorklet({
    ...emptySets,
    inputString,
    sevenTvChannelEmotes,
    userstate: null,
  });
}

function previewParts(
  inputString: string,
  sevenTvChannelEmotes: SanitisedEmote[],
): ParsedPart[] {
  return replaceTextWithEmotes({
    ...emptySets,
    inputString,
    sevenTvChannelEmotes,
    userstate: createUserStateTags({ username: 'someuser' }),
  });
}

function shape(parts: ParsedPart[]): Record<string, unknown>[] {
  return parts.map(part => {
    if (part.type === 'text') {
      return { type: part.type, content: part.content };
    }
    const emotePart = part as ParsedPart & {
      name?: string;
      overlaid?: { id: string }[];
    };
    return {
      type: part.type,
      name: emotePart.name,
      overlaidIds: (emotePart.overlaid ?? []).map(entry => entry.id),
    };
  });
}

describe('emote resolution divergence: live ingest vs preview', () => {
  test('zero-width overlays compose in the live pipeline only', () => {
    const emotes = [kappa, overlay];

    const live = shape(liveParts('Kappa Overlay', emotes));
    const preview = shape(previewParts('Kappa Overlay', emotes));

    expect(live).toEqual([
      { type: 'emote', name: 'Kappa', overlaidIds: ['overlay-id'] },
    ]);
    expect(preview).toEqual([
      { type: 'emote', name: 'Kappa', overlaidIds: [] },
      { type: 'text', content: ' ' },
      { type: 'emote', name: 'Overlay', overlaidIds: [] },
    ]);
  });

  test('trailing punctuation defeats the live match but not the preview match', () => {
    const emotes = [kappa];

    const live = shape(liveParts('Kappa!', emotes));
    const preview = shape(previewParts('Kappa!', emotes));

    expect(live).toEqual([{ type: 'text', content: 'Kappa!' }]);
    expect(preview).toEqual([
      { type: 'emote', name: 'Kappa', overlaidIds: [] },
      { type: 'text', content: '!' },
    ]);
  });

  test('original_name aliases resolve in the preview pipeline only', () => {
    const emotes = [renamed];

    const live = shape(liveParts('OldName', emotes));
    const preview = shape(previewParts('OldName', emotes));

    expect(live).toEqual([{ type: 'text', content: 'OldName' }]);
    expect(preview).toEqual([
      { type: 'emote', name: 'NewName', overlaidIds: [] },
    ]);
  });
});
