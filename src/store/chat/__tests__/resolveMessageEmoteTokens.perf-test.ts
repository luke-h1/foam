import { measureFunction } from 'reassure';

import * as personalEmotes from '@app/store/chat/actions/personal-emotes';
import { resolveMessageEmoteTokens } from '@app/store/chat/actions/resolveMessageEmoteTokens';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import * as getChannelCheermotesModule from '@app/utils/chat/cheermote-store/getChannelCheermotes';

import {
  denseEmoteData,
  reprocessChatLines,
} from '../__fixtures__/resolveMessageEmoteTokens.perf.fixture';

jest.spyOn(personalEmotes, 'getUserPersonalEmotes').mockReturnValue([]);

jest
  .spyOn(getChannelCheermotesModule, 'getChannelCheermotes')
  .mockReturnValue(undefined);

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

describe('resolveMessageEmoteTokens performance', () => {
  test('reprocesses a mixed chat batch through the ingest/reprocess path', async () => {
    await measureFunction(() => {
      for (const line of reprocessChatLines) {
        resolveMessageEmoteTokens({
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
