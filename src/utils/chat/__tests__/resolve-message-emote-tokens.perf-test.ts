import { measureFunction } from 'reassure';

import * as personalEmotes from '@app/store/chat/actions/personal-emotes';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import * as getChannelCheermotesModule from '@app/utils/chat/cheermote-store/get-channel-cheermotes';
import { resolveMessageEmoteParts } from '@app/utils/chat/resolve-message-emote-tokens';

import {
  denseEmoteData,
  reprocessChatLines,
} from '../__fixtures__/resolve-message-emote-tokens.perf.fixture';

jest.spyOn(personalEmotes, 'getUserPersonalEmotes').mockReturnValue([]);

jest
  .spyOn(getChannelCheermotesModule, 'getChannelCheermotes')
  .mockReturnValue(undefined);

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

describe('resolveMessageEmoteParts performance', () => {
  test('reprocesses a mixed chat batch through the ingest/reprocess path', async () => {
    await measureFunction(() => {
      for (const line of reprocessChatLines) {
        resolveMessageEmoteParts({
          channelId: 'perf-channel',
          emoteData: denseEmoteData,
          show7TvEmotes: true,
          text: line.text,
          userId: line.userId,
          userLogin: 'luke',
          userstate: createUserStateTags({
            username: line.login,
            login: line.login,
            'user-id': line.userId,
            'display-name': line.login,
          }),
        });
      }
    }, MEASURE_OPTIONS);
  });
});
