import { measureFunction } from 'reassure';

import { resolveMessageEmoteParts } from '@app/components/Chat/util/resolveMessageEmoteParts';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';

import {
  denseEmoteData,
  reprocessChatLines,
} from './__fixtures__/resolveMessageEmoteParts.perf.fixture';

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  getCurrentEmoteData: jest.fn(),
  getUserPersonalEmotes: jest.fn(() => []),
}));

jest.mock('@app/utils/chat/cheermoteStore/getChannelCheermotes', () => ({
  getChannelCheermotes: jest.fn(() => null),
}));

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
