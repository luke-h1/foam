import {
  createAnnouncementTags,
  createAnonGiftPaidUpgradeTags,
  createBitsBadgeTierTags,
  createCharityDonationTags,
  createGiftPaidUpgradeTags,
  createHighlightedMessageTags,
  createModiversaryTags,
  createPrimePaidUpgradeTags,
  createRaidTags,
  createResubTags,
  createRewardGiftTags,
  createRitualTags,
  createSharedChatNoticeTags,
  createSubGiftTags,
  createSubMysteryGiftTags,
  createSubscriptionTags,
  createUnraidTags,
  createViewerMilestoneTags,
} from '@app/types/chat/irc-tags/__fixtures__/userNoticeTags.fixture';
import type { BaseUserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { getCachedChannelPointRewardTitle } from '@app/utils/chat/channelPointRewardTitleStore';

import {
  createBaseMessage,
  createSystemMessage,
  createUserNoticeMessage,
  createUserStateFromTags,
} from '../messageHandlers';

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  getCurrentEmoteData: jest.fn(),
}));

jest.mock('@app/utils/string/generateNonce', () => ({
  generateNonce: jest.fn().mockReturnValue('test-nonce-123'),
}));

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

    test('should mark Highlight My Message PRIVMSG tags as highlighted', () => {
      const params = {
        tags: {
          'display-name': 'Rexdain',
          login: 'rexdain',
          id: 'msg-highlight-123',
          'msg-id': 'highlighted-message',
          'custom-reward-id': 'reward-highlight',
        },
        channelName: 'testchannel',
        text: 'Kappa',
      };

      const result = createBaseMessage(params);

      expect(result.isHighlightedMessage).toBe(true);
      expect(result.isChannelPointRedemption).toBe(true);
      expect(result.userstate['msg-id']).toBe('highlighted-message');
    });

    test('should use the Twitch message id for message_nonce when present', () => {
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

      expect(result.message_nonce).toBe('msg-123');
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
      expect(result.message_nonce).toBe('test-nonce-123');
    });
  });

  describe('createUserNoticeMessage', () => {
    test('should create viewermilestone notice', () => {
      const tags = createViewerMilestoneTags({
        'display-name': 'MilestoneUser',
        login: 'milestoneuser',
        'system-msg': 'MilestoneUser watched 5 consecutive streams',
        color: '#1AC9A2',
        'msg-param-value': '5',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('viewermilestone');
      expect(result.message[0]?.type).toBe('viewermilestone');
    });

    test('should create sub notice', () => {
      const tags = createSubscriptionTags({
        'display-name': 'SubUser',
        login: 'subuser',
        'system-msg': 'SubUser subscribed with Tier 1',
        color: '#0000FF',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: 'Thanks for the stream!',
      });

      expect(result.notice_tags?.['msg-id']).toBe('sub');
      expect(result.message[0]?.type).toBe('sub');
    });

    test('should create resub notice', () => {
      const tags = createResubTags({
        'msg-param-cumulative-months': '12',
        'display-name': 'ResubUser',
        login: 'resubuser',
        'system-msg': 'ResubUser resubscribed for 12 months',
        color: '#FF00FF',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: 'Love this channel!',
      });

      expect(result.notice_tags?.['msg-id']).toBe('resub');
      expect(result.message[0]?.type).toBe('resub');
    });

    test('should create subgift notice', () => {
      const tags = createSubGiftTags({
        'msg-param-recipient-display-name': 'GiftRecipient',
        'msg-param-recipient-id': '67890',
        'display-name': 'GiftGiver',
        login: 'giftgiver',
        'system-msg': 'GiftGiver gifted a subscription to GiftRecipient',
        color: '#FFFF00',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('subgift');
    });

    test('should create raid notice', () => {
      const tags = createRaidTags({
        'msg-param-displayName': 'RaidLeader',
        'msg-param-viewerCount': '500',
        'display-name': 'RaidLeader',
        login: 'raidleader',
        'system-msg': '500 raiders from RaidLeader have joined!',
        color: '#00FFFF',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('raid');
      expect(result.isTwitchSystemNotice).toBe(true);
      expect(result.message).toEqual([
        { type: 'text', content: '500 raiders from RaidLeader have joined!' },
      ]);
    });

    test('should create anongiftpaidupgrade notice', () => {
      const tags = createAnonGiftPaidUpgradeTags({
        'msg-param-promo-name': 'SummerPromo',
        'msg-param-promo-gift-total': '10',
        'display-name': 'UpgradeUser',
        login: 'upgradeuser',
        'system-msg': 'UpgradeUser is continuing the gift sub',
        color: '#FF8800',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('anongiftpaidupgrade');
    });

    test('should create submysterygift notice', () => {
      const tags = createSubMysteryGiftTags({
        'msg-param-mass-gift-count': '5',
        'msg-param-sender-count': '42',
        'display-name': 'MysteryGifter',
        login: 'mysterygifter',
        'system-msg': 'MysteryGifter gifted 5 Tier 1 Subs to the community!',
        color: '#33CC99',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('submysterygift');
      expect(result.message[0]?.type).toBe('submysterygift');
    });

    test('should create giftpaidupgrade notice', () => {
      const tags = createGiftPaidUpgradeTags({
        'msg-param-sender-login': 'gifterlogin',
        'msg-param-sender-name': 'GiftSender',
        'msg-param-promo-name': 'Subtember',
        'msg-param-promo-gift-total': '12',
        'display-name': 'UpgradeUser',
        login: 'upgradeuser',
        'system-msg':
          'UpgradeUser is continuing the gift sub they got from GiftSender!',
        color: '#FF8800',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('giftpaidupgrade');
      expect(result.message[0]?.type).toBe('giftpaidupgrade');
    });

    test('should create a channel point redemption notice without chat text', () => {
      const tags = createRewardGiftTags({
        'display-name': 'RewardUser',
        login: 'rewarduser',
        'system-msg': 'RewardUser redeemed Hydrate',
        'room-id': '67890',
        'custom-reward-id': 'reward-123',
        'msg-param-reward-title': 'Hydrate',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('rewardgift');
      expect(result.isChannelPointRedemption).not.toBe(true);
      expect(result.isTwitchSystemNotice).toBe(true);
      expect(result.message[0]?.type).toBe('text');
      expect(
        result.message[0] && 'content' in result.message[0]
          ? result.message[0].content
          : '',
      ).toBe('RewardUser redeemed Hydrate');
      expect(getCachedChannelPointRewardTitle('67890', 'reward-123')).toBe(
        'Hydrate',
      );
    });

    test('should create bitsbadgetier as a twitch system notice', () => {
      const tags = createBitsBadgeTierTags({
        'msg-param-threshold': '1000',
        'display-name': 'Cheerer',
        login: 'cheerer',
        'system-msg': 'Cheerer earned the 1,000 Bits badge!',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('bitsbadgetier');
      expect(result.isTwitchSystemNotice).toBe(true);
      expect(result.message).toEqual([
        { type: 'text', content: 'Cheerer earned the 1,000 Bits badge!' },
      ]);
    });

    test('should create unraid as a twitch system notice', () => {
      const tags = createUnraidTags({
        'display-name': 'Streamer',
        login: 'streamer',
        'system-msg': 'The raid has been cancelled.',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('unraid');
      expect(result.isTwitchSystemNotice).toBe(true);
      expect(result.message).toEqual([
        { type: 'text', content: 'The raid has been cancelled.' },
      ]);
    });

    test('should create sharedchatnotice as a twitch system notice', () => {
      const tags = createSharedChatNoticeTags({
        'display-name': 'Streamer',
        login: 'streamer',
        'system-msg': 'Shared chat connected with partner channel.',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('sharedchatnotice');
      expect(result.isTwitchSystemNotice).toBe(true);
      expect(result.message).toEqual([
        {
          type: 'text',
          content: 'Shared chat connected with partner channel.',
        },
      ]);
    });

    test('should create modiversary as a twitch system notice', () => {
      const tags = createModiversaryTags({
        'display-name': 'ModUser',
        login: 'moduser',
        'msg-param-months': '24',
        'system-msg':
          'ModUser\\sis\\scelebrating\\s24\\smonths\\sas\\sa\\smoderator!',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('modiversary');
      expect(result.isTwitchSystemNotice).toBe(true);
      expect(result.message).toEqual([
        {
          type: 'text',
          content: 'ModUser is celebrating 24 months as a moderator!',
        },
      ]);
    });

    test('should create modiversary text from tags when system message is missing', () => {
      const tags = createModiversaryTags({
        'display-name': 'ModUser',
        login: 'moduser',
        'msg-param-months': '24',
        'system-msg': undefined,
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.notice_tags?.['msg-id']).toBe('modiversary');
      expect(result.isTwitchSystemNotice).toBe(true);
      expect(result.message).toEqual([
        {
          type: 'text',
          content:
            'ModUser, thank you for protecting our community for 24 months!',
        },
      ]);
    });

    test('should handle announcement notices with user metadata', () => {
      const tags = createAnnouncementTags();

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: 'this is an announcement to bait him',
      });

      expect(result.notice_tags?.['msg-id']).toBe('announcement');
      expect(result.message_id).toBe('55d90904-e515-47d0-ac1d-879f7f1d7b01');
      expect(result.isAnnouncement).toBe(true);
      expect(result.isTwitchSystemNotice).toBeUndefined();
      expect(result.sender).toBe('Gekon');
      expect(result.userstate.username).toBe('Gekon');
      expect(result.message).toEqual([
        {
          type: 'text',
          content: 'this is an announcement to bait him',
        },
      ]);
    });

    test('should handle highlighted-message notices with user metadata', () => {
      const tags = createHighlightedMessageTags();

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: 'this message is highlighted',
      });

      expect(result.isHighlightedMessage).toBe(true);
      expect(result.isChannelPointRedemption).toBe(true);
      expect(result.isTwitchSystemNotice).toBeUndefined();
      expect(result.sender).toBe('HighlightedUser');
      expect(result.message).toEqual([
        { type: 'text', content: 'this message is highlighted' },
      ]);
    });

    test('should handle charitydonation notices', () => {
      const tags = createCharityDonationTags({
        'display-name': 'Donor',
        login: 'donor',
        'msg-param-charity-name': 'St. Jude',
        'msg-param-donation-amount': '500',
        'msg-param-exponent': '2',
        'msg-param-donation-currency': 'USD',
        'system-msg': 'Donor donated $5.00 to St. Jude',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.message[0]?.type).toBe('charitydonation');
      if (result.message[0]?.type === 'charitydonation') {
        expect(result.message[0].charityName).toBe('St. Jude');
        expect(result.message[0].amount).toMatch(/5\.00/);
      }
    });

    test('should handle ritual notices for new chatters', () => {
      const tags = createRitualTags({
        'display-name': 'NewChatter',
        login: 'newchatter',
        'msg-param-ritual-name': 'new_chatter',
        'system-msg': 'NewChatter is new here.',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.message[0]?.type).toBe('ritual');
      if (result.message[0]?.type === 'ritual') {
        expect(result.message[0].ritualName).toBe('new_chatter');
      }
    });

    test('should handle primepaidupgrade as subscription notice', () => {
      const tags = createPrimePaidUpgradeTags({
        'display-name': 'PrimeUser',
        login: 'primeuser',
        'msg-param-sub-plan': '1000',
        'msg-param-cumulative-months': '3',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.message[0]?.type).toBe('primepaidupgrade');
    });

    test('should flag shared chat duplicated notices', () => {
      const tags = createRaidTags({
        'room-id': '123',
        'source-room-id': '456',
        'system-msg': 'Raid from another channel',
        'msg-param-displayName': '',
        'msg-param-login': '',
        'msg-param-viewerCount': '0',
      });

      const result = createUserNoticeMessage({
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.isSharedChatDuplicated).toBe(true);
    });

    test('should handle unknown msg-id with default case', () => {
      const tags: BaseUserNoticeTags = {
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
      };

      const result = createUserNoticeMessage({
        // @ts-expect-error -- Twitch can emit msg-id values outside our typed union
        tags,
        channelName: 'testchannel',
        text: '',
      });

      expect(result.message).toEqual([
        { type: 'text', content: 'Some unknown notice' },
      ]);
      expect(result.isTwitchSystemNotice).toBe(true);
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
});
