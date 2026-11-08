import { twitchApi } from '@app/services/api/clients';
import {
  registerMentionLoginsFromTokens,
  resetMentionLogins,
} from '@app/store/chat/actions/mention-login-lookup';
import type { MessageToken } from '@app/types/chat/messageToken';
import { getAllMentionChatters } from '@app/utils/chat/resolve-mention-login/getAllMentionChatters';
import { getMentionLogin } from '@app/utils/chat/resolve-mention-login/getMentionLogin';
import { registerMentionChatter } from '@app/utils/chat/resolve-mention-login/registerMentionChatter';
import type { MentionChatter } from '@app/utils/chat/resolve-mention-login/types';

function mentionPart(content: string): MessageToken<'mention'> {
  return { type: 'mention', content };
}

describe('registerMentionLoginsFromTokens', () => {
  let mockGet: jest.SpiedFunction<typeof twitchApi.get>;

  beforeEach(() => {
    jest.useFakeTimers();
    resetMentionLogins();
    mockGet = jest.spyOn(twitchApi, 'get').mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    mockGet.mockRestore();
    jest.useRealTimers();
  });

  test('requests Helix once for every lowercase mention with no known casing', async () => {
    registerMentionLoginsFromTokens([
      mentionPart('@zzzsleepyboyx'),
      mentionPart('@erobb221'),
      mentionPart('@DylanSoyBoy'),
    ]);

    await jest.advanceTimersByTimeAsync(400);

    expect(mockGet).toHaveBeenCalledTimes(1);
    const url = mockGet.mock.calls[0]?.[0];

    const logins = new URLSearchParams(url?.split('?')[1] ?? '')
      .getAll('login')
      .sort();

    expect(logins).toEqual(['erobb221', 'zzzsleepyboyx']);

    expect(getMentionLogin('dylansoyboy')).toBe('DylanSoyBoy');
  });

  test('does not request Helix when no mention is a valid login', async () => {
    registerMentionLoginsFromTokens([mentionPart('@,'), mentionPart('@.')]);

    await jest.advanceTimersByTimeAsync(400);

    expect(mockGet).not.toHaveBeenCalled();
  });

  test('drops a Helix response that arrives after a reset', async () => {
    let resolveRequest: (value: {
      data: { id: string; login: string }[];
    }) => void = () => {};

    mockGet.mockReturnValue(
      new Promise(resolve => {
        resolveRequest = resolve;
      }),
    );

    registerMentionLoginsFromTokens([mentionPart('@oldchannelviewer')]);
    await jest.advanceTimersByTimeAsync(400);

    resetMentionLogins();

    resolveRequest({ data: [{ id: '1', login: 'OldChannelViewer' }] });
    await jest.advanceTimersByTimeAsync(0);

    expect(getMentionLogin('oldchannelviewer')).toBe('oldchannelviewer');
  });

  test('keeps a chatter colour that chat already set when Helix resolves its casing', async () => {
    registerMentionChatter({ login: 'painter', color: '#123456' });
    mockGet.mockResolvedValue({ data: [{ id: '7', login: 'Painter' }] });

    registerMentionLoginsFromTokens([mentionPart('@painter')]);
    await jest.advanceTimersByTimeAsync(400);

    expect(getAllMentionChatters()).toEqual<MentionChatter[]>([
      { login: 'Painter', userId: '7', color: '#123456', role: undefined },
    ]);
  });
});
