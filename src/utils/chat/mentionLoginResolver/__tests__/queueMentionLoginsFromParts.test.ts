import { twitchApi } from '@app/services/api/clients';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { queueMentionLoginsFromParts } from '../queueMentionLoginsFromParts';
import { resetMentionLoginResolver } from '../resetMentionLoginResolver';

function mentionPart(content: string): ParsedPart<'mention'> {
  return { type: 'mention', content };
}

describe('queueMentionLoginsFromParts', () => {
  let mockGet: jest.SpiedFunction<typeof twitchApi.get>;

  beforeEach(() => {
    jest.useFakeTimers();
    resetMentionLoginResolver();
    mockGet = jest.spyOn(twitchApi, 'get').mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    mockGet.mockRestore();
    jest.useRealTimers();
  });

  test('strips trailing punctuation from mention logins before requesting Helix', async () => {
    queueMentionLoginsFromParts([
      mentionPart('@zzzsleepyboyx,'),
      mentionPart('@erobb221'),
      mentionPart('@dylansoyboy,'),
    ]);

    await jest.advanceTimersByTimeAsync(400);

    expect(mockGet).toHaveBeenCalledTimes(1);
    const url = mockGet.mock.calls[0]?.[0];

    const logins = new URLSearchParams(url?.split('?')[1] ?? '')
      .getAll('login')
      .sort();

    expect(logins).toEqual(['dylansoyboy', 'erobb221', 'zzzsleepyboyx']);
  });

  test('does not request Helix when every mention is punctuation-only', async () => {
    queueMentionLoginsFromParts([mentionPart('@,'), mentionPart('@.')]);

    await jest.advanceTimersByTimeAsync(400);

    expect(mockGet).not.toHaveBeenCalled();
  });
});
