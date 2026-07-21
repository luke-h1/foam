import { getCachedChannelPointRewardTitle } from '@app/store/chat/actions/channelPointRewardTitles';
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
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { createUserNoticeMessage } from '../createUserNoticeMessage';

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  getCurrentEmoteData: jest.fn(),
}));

jest.mock('@app/utils/string/generateNonce', () => ({
  generateNonce: jest.fn().mockReturnValue('test-nonce-123'),
}));

describe('createUserNoticeMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    expect(result.message).toEqual<ParsedPart[]>([
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
    expect(result.message[0]).toEqual<ParsedPart>({
      type: 'text',
      content: 'RewardUser redeemed Hydrate',
    });
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
    expect(result.message).toEqual<ParsedPart[]>([
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
    expect(result.message).toEqual<ParsedPart[]>([
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
    expect(result.message).toEqual<ParsedPart[]>([
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
      // Tags reach handlers already IRCv3-unescaped (parseIrcTags decodes).
      'system-msg': 'ModUser is celebrating 24 months as a moderator!',
    });

    const result = createUserNoticeMessage({
      tags,
      channelName: 'testchannel',
      text: '',
    });

    expect(result.notice_tags?.['msg-id']).toBe('modiversary');
    expect(result.isTwitchSystemNotice).toBe(true);
    expect(result.message).toEqual<ParsedPart[]>([
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
    expect(result.message).toEqual<ParsedPart[]>([
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
    expect(result.message).toEqual<ParsedPart[]>([
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
    expect(result.message).toEqual<ParsedPart[]>([
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

    expect(result.message).toEqual<ParsedPart[]>([
      { type: 'text', content: 'Some unknown notice' },
    ]);
    expect(result.isTwitchSystemNotice).toBe(true);
    expect(result.badges).toEqual<SanitisedBadgeSet[]>([]);
  });
});
