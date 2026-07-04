import { twitchApi } from '@app/services/api/clients';
import {
  queueMentionLoginsFromParts,
  resetMentionLoginResolver,
} from '@app/utils/chat/mentionLoginResolver';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import { getMentionLogin } from '@app/utils/chat/resolveMentionLogin';

jest.mock('@app/services/api/clients', () => ({
  twitchApi: {
    get: jest.fn(),
  },
}));

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    searchChannels: jest.fn(),
  },
}));

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    mentionLoginRevision: {
      set: jest.fn(),
    },
  },
}));

jest.mock('@app/store/chat/actions/chatColorCaches', () => ({
  clearSessionCache: jest.fn(),
}));

jest.mock('@app/utils/chat/generateRandomTwitchColor', () => ({
  generateRandomTwitchColor: jest.fn(() => '#ffffff'),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      debug: jest.fn(),
    },
  },
}));

jest.mock('@app/utils/chat/resolveMentionLogin', () => ({
  getMentionLogin: jest.fn((login: string) => login.toLowerCase()),
  registerMentionChatter: jest.fn(),
  registerMentionLogin: jest.fn(),
}));

const mockGet = jest.mocked(twitchApi.get);
const mockGetMentionLogin = jest.mocked(getMentionLogin);

function mentionPart(content: string): ParsedPart<'mention'> {
  return { type: 'mention', content };
}

describe('mentionLoginResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    resetMentionLoginResolver();
    mockGet.mockResolvedValue({ data: [] });
    mockGetMentionLogin.mockImplementation((login: string) =>
      login.toLowerCase(),
    );
  });

  afterEach(() => {
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
    const url = mockGet.mock.calls[0]?.[0] as string;

    expect(url).not.toContain('%2C');
    expect(url).not.toContain(',');
    expect(url).toContain('login=zzzsleepyboyx');
    expect(url).toContain('login=erobb221');
    expect(url).toContain('login=dylansoyboy');
  });

  test('does not request Helix when every mention is punctuation-only', async () => {
    queueMentionLoginsFromParts([mentionPart('@,'), mentionPart('@.')]);

    await jest.advanceTimersByTimeAsync(400);

    expect(mockGet).not.toHaveBeenCalled();
  });
});
