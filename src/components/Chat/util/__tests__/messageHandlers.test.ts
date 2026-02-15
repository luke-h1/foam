/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { getCurrentEmoteData } from '@app/store/chatStore';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { SanitisedEmote } from '@app/types/emote';
import {
  createUserStateFromTags,
  createBaseMessage,
  createUserNoticeMessage,
  createSystemMessage,
  hasEmoteData,
} from '../messageHandlers';

jest.mock('@app/store/chatStore', () => ({
  getCurrentEmoteData: jest.fn(),
}));

jest.mock('@app/utils/string/generateNonce', () => ({
  generateNonce: jest.fn().mockReturnValue('test-nonce-123'),
}));

const mockGetCurrentEmoteData = getCurrentEmoteData as jest.MockedFunction<
  typeof getCurrentEmoteData
>;

interface MockEmoteData {
  twitchGlobalEmotes: SanitisedEmote[];
  sevenTvGlobalEmotes: SanitisedEmote[];
  bttvGlobalEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  twitchChannelEmotes: SanitisedEmote[];
  sevenTvChannelEmotes: SanitisedEmote[];
  bttvChannelEmotes: SanitisedEmote[];
  ffzChannelEmotes: SanitisedEmote[];
}

const createMockEmoteData = (
  overrides: Partial<MockEmoteData> = {},
): MockEmoteData => ({
  twitchGlobalEmotes: [],
  sevenTvGlobalEmotes: [],
  bttvGlobalEmotes: [],
  ffzGlobalEmotes: [],
  twitchChannelEmotes: [],
  sevenTvChannelEmotes: [],
  bttvChannelEmotes: [],
  ffzChannelEmotes: [],
  ...overrides,
});

describe('messageHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserStateFromTags', () => {
    test('should create userstate from basic tags', () => {
      const tags = {
        'display-name': 'TestUser',
        login: 'testuser',
        color: '#FF5500',
        badges: 'subscriber/12,premium/1',
        mod: '0',
        subscriber: '1',
      };

      const result = createUserStateFromTags(tags);

      expect(result.username).toBe('TestUser');
      expect(result.login).toBe('testuser');
      expect(result.color).toBe('#FF5500');
    });

    test('should handle missing display-name by using login', () => {
      const tags = {
        login: 'testuser',
      };

      const result = createUserStateFromTags(tags);

      // When display-name is missing, username falls back to login
      expect(result.username).toBe('testuser');
      expect(result.login).toBe('testuser');
    });

    test('should handle missing login by using lowercase display-name', () => {
      const tags = {
        'display-name': 'TestUser',
      };

      const result = createUserStateFromTags(tags);

      expect(result.username).toBe('TestUser');
      expect(result.login).toBe('testuser');
    });

    test('should include reply parent information', () => {
      const tags = {
        'display-name': 'TestUser',
        login: 'testuser',
        'reply-parent-msg-id': 'parent-123',
        'reply-parent-msg-body': 'Hello world',
        'reply-parent-display-name': 'ParentUser',
        'reply-parent-user-login': 'parentuser',
      };

      const result = createUserStateFromTags(tags);

      expect(result['reply-parent-msg-id']).toBe('parent-123');
      expect(result['reply-parent-msg-body']).toBe('Hello world');
      expect(result['reply-parent-display-name']).toBe('ParentUser');
      expect(result['reply-parent-user-login']).toBe('parentuser');
    });

    test('should default reply fields to empty strings', () => {
      const tags = {
        'display-name': 'TestUser',
        login: 'testuser',
      };

      const result = createUserStateFromTags(tags);

      expect(result['reply-parent-msg-id']).toBe('');
      expect(result['reply-parent-msg-body']).toBe('');
      expect(result['reply-parent-display-name']).toBe('');
      expect(result['reply-parent-user-login']).toBe('');
    });
  });

  describe('createBaseMessage', () => {
    test('should create a base message with required fields', () => {
      const params = {
        tags: {
          'display-name': 'TestUser',
          login: 'testuser',
          id: 'msg-123',
          color: '#FF0000',
        },
        channelName: 'testchannel',
        text: 'Hello world!',
      };

      const result = createBaseMessage(params);

      expect(result.channel).toBe('testchannel');
      expect(result.sender).toBe('TestUser');
      expect(result.message_id).toBe('msg-123');
      expect(result.message).toEqual([
        { type: 'text', content: 'Hello world!' },
      ]);
    });

    test('should trim trailing whitespace from text', () => {
      const params = {
        tags: {
          'display-name': 'TestUser',
          login: 'testuser',
          id: 'msg-123',
        },
        channelName: 'testchannel',
        text: 'Hello world!   \n\n',
      };

      const result = createBaseMessage(params);
      const firstMessage = result.message[0];

      expect(
        firstMessage && 'content' in firstMessage && firstMessage.content,
      ).toBe('Hello world!');
    });

    test('should use nonce for message_nonce', () => {
      const params = {
        tags: {
          'display-name': 'TestUser',
          login: 'testuser',
          id: 'msg-123',
        },
        channelName: 'testchannel',
        text: 'Hello',
      };

      const result = createBaseMessage(params);

      expect(result.message_nonce).toBe('test-nonce-123');
    });

    test('should default message_id to "0" when id not in tags', () => {
      const params = {
        tags: {
          'display-name': 'TestUser',
          login: 'testuser',
        },
        channelName: 'testchannel',
        text: 'Hello',
      };

      const result = createBaseMessage(params);

      expect(result.message_id).toBe('0');
    });
  });

  describe('createUserNoticeMessage', () => {
    test('should create viewermilestone notice', () => {
      const tags: UserNoticeTags = {
        'msg-id': 'viewermilestone',
        'msg-param-category': 'watch-streak',
        'msg-param-value': '5',
        'display-name': 'MilestoneUser',
        login: 'milestoneuser',
        'system-msg': 'MilestoneUser watched 5 consecutive streams',
        color: '#00FF00',
        badges: '',
        'badge-info': '',
        emotes: '',
        flags: '',
        mod: '',
        'user-id': '12345',
        'user-type': '',
      } as unknown as UserNoticeTags;

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('viewermilestone');
      expect(result.message[0]?.type).toBe('viewermilestone');
    });

    test('should create sub notice', () => {
      const tags: UserNoticeTags = {
        'msg-id': 'sub',
        'msg-param-sub-plan': '2000',
        'msg-param-sub-plan-name': 'Tier 1',
        'display-name': 'SubUser',
        login: 'subuser',
        'system-msg': 'SubUser subscribed with Tier 1',
        color: '#0000FF',
        badges: '',
        'badge-info': '',
        emotes: '',
        flags: '',
        mod: '',
        'user-id': '12345',
        'user-type': '',
      } as unknown as UserNoticeTags;

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: 'Thanks for the stream!',
      });

      expect(result.notice_tags?.['msg-id']).toBe('sub');
      expect(result.message[0]?.type).toBe('sub');
    });

    test('should create resub notice', () => {
      const tags: UserNoticeTags = {
        'msg-id': 'resub',
        'msg-param-cumulative-months': '12',
        'msg-param-sub-plan': '2000',
        'msg-param-sub-plan-name': 'Tier 1',
        'display-name': 'ResubUser',
        login: 'resubuser',
        'system-msg': 'ResubUser resubscribed for 12 months',
        color: '#FF00FF',
        badges: '',
        'badge-info': '',
        emotes: '',
        flags: '',
        mod: '',
        'user-id': '12345',
        'user-type': '',
      } as unknown as UserNoticeTags;

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: 'Love this channel!',
      });

      expect(result.notice_tags?.['msg-id']).toBe('resub');
      expect(result.message[0]?.type).toBe('resub');
    });

    test('should create subgift notice', () => {
      const tags: UserNoticeTags = {
        'msg-id': 'subgift',
        'msg-param-recipient-display-name': 'GiftRecipient',
        'msg-param-recipient-id': '67890',
        'msg-param-sub-plan': '2000',
        'display-name': 'GiftGiver',
        login: 'giftgiver',
        'system-msg': 'GiftGiver gifted a subscription to GiftRecipient',
        color: '#FFFF00',
        badges: '',
        'badge-info': '',
        emotes: '',
        flags: '',
        mod: '',
        'user-id': '12345',
        'user-type': '',
      } as unknown as UserNoticeTags;

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('subgift');
    });

    test('should create raid notice', () => {
      const tags: UserNoticeTags = {
        'msg-id': 'raid',
        'msg-param-displayName': 'RaidLeader',
        'msg-param-viewerCount': '500',
        'display-name': 'RaidLeader',
        login: 'raidleader',
        'system-msg': '500 raiders from RaidLeader have joined!',
        color: '#00FFFF',
        badges: '',
        'badge-info': '',
        emotes: '',
        flags: '',
        mod: '',
        'user-id': '12345',
        'user-type': '',
      } as unknown as UserNoticeTags;

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('raid');
      expect(result.message).toEqual([]);
    });

    test('should create anongiftpaidupgrade notice', () => {
      const tags: UserNoticeTags = {
        'msg-id': 'anongiftpaidupgrade',
        'msg-param-promo-name': 'SummerPromo',
        'msg-param-promo-gift-total': '10',
        'display-name': 'UpgradeUser',
        login: 'upgradeuser',
        'system-msg': 'UpgradeUser is continuing the gift sub',
        color: '#FF8800',
        badges: '',
        'badge-info': '',
        emotes: '',
        flags: '',
        mod: '',
        'user-id': '12345',
        'user-type': '',
      } as unknown as UserNoticeTags;

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('anongiftpaidupgrade');
    });

    test('should handle unknown msg-id with default case', () => {
      const tags = {
        'msg-id': 'unknown_type',
        'display-name': 'UnknownUser',
        login: 'unknownuser',
        'system-msg': 'Some unknown notice',
        color: '#808080',
        badges: '',
        'badge-info': '',
        emotes: '',
        flags: '',
        mod: '',
        'user-id': '12345',
        'user-type': '',
      } as unknown as UserNoticeTags;

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.message).toEqual([]);
      expect(result.badges).toEqual([]);
    });
  });

  describe('createSystemMessage', () => {
    test('should create a system message', () => {
      const result = createSystemMessage(
        'testchannel',
        'Connection established',
      );

      expect(result.channel).toBe('testchannel');
      expect(result.sender).toBe('System');
      expect(result.message).toEqual([
        { type: 'text', content: 'Connection established' },
      ]);
    });

    test('should have system userstate', () => {
      const result = createSystemMessage('testchannel', 'Test message');

      expect(result.userstate['display-name']).toBe('System');
      expect(result.userstate.login).toBe('system');
      expect(result.userstate.color).toBe('#808080');
    });

    test('should generate unique message IDs', () => {
      const result1 = createSystemMessage('channel', 'Message 1');
      const result2 = createSystemMessage('channel', 'Message 2');

      // IDs should start with 'system-'
      expect(result1.message_id).toMatch(/^system-/);
      expect(result2.message_id).toMatch(/^system-/);
    });

    test('should have empty badges', () => {
      const result = createSystemMessage('testchannel', 'Test');

      expect(result.badges).toEqual([]);
    });
  });

  describe('hasEmoteData', () => {
    test('should return true when twitch global emotes exist', () => {
      mockGetCurrentEmoteData.mockReturnValue(
        createMockEmoteData({
          twitchGlobalEmotes: [{ id: '1', name: 'Kappa' } as SanitisedEmote],
        }) as any,
      );

      expect(hasEmoteData('channel-123')).toBe(true);
    });

    test('should return true when 7TV global emotes exist', () => {
      mockGetCurrentEmoteData.mockReturnValue(
        createMockEmoteData({
          sevenTvGlobalEmotes: [
            { id: '1', name: 'OMEGALUL' } as SanitisedEmote,
          ],
        }) as any,
      );

      expect(hasEmoteData('channel-123')).toBe(true);
    });

    test('should return true when BTTV global emotes exist', () => {
      mockGetCurrentEmoteData.mockReturnValue(
        createMockEmoteData({
          bttvGlobalEmotes: [{ id: '1', name: 'LULW' } as SanitisedEmote],
        }) as any,
      );

      expect(hasEmoteData('channel-123')).toBe(true);
    });

    test('should return true when FFZ global emotes exist', () => {
      mockGetCurrentEmoteData.mockReturnValue(
        createMockEmoteData({
          ffzGlobalEmotes: [{ id: '1', name: 'KEKW' } as SanitisedEmote],
        }) as any,
      );

      expect(hasEmoteData('channel-123')).toBe(true);
    });

    test('should return false when no global emotes exist', () => {
      mockGetCurrentEmoteData.mockReturnValue(createMockEmoteData() as any);

      expect(hasEmoteData('channel-123')).toBe(false);
    });

    test('should return false when emote data is null', () => {
      mockGetCurrentEmoteData.mockReturnValue(null as any);

      expect(hasEmoteData('channel-123')).toBe(false);
    });

    test('should ignore channel-only emotes for hasEmoteData check', () => {
      mockGetCurrentEmoteData.mockReturnValue(
        createMockEmoteData({
          twitchChannelEmotes: [
            { id: '1', name: 'ChannelEmote' } as SanitisedEmote,
          ],
          sevenTvChannelEmotes: [
            { id: '2', name: 'ChannelSTV' } as SanitisedEmote,
          ],
          bttvChannelEmotes: [
            { id: '3', name: 'ChannelBTTV' } as SanitisedEmote,
          ],
          ffzChannelEmotes: [{ id: '4', name: 'ChannelFFZ' } as SanitisedEmote],
        }) as any,
      );

      // hasEmoteData only checks global emotes
      expect(hasEmoteData('channel-123')).toBe(false);
    });
  });
});
