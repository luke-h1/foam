import type {
  AnnouncementTags,
  SubscriptionTags,
} from '@app/types/chat/irc-tags/usernotice';
import type { Meta, StoryObj } from '@storybook/react';
import { RichChatMessage } from './RichChatMessage';
import {
  broadcasterBadge,
  chatStoryDecorator,
  createBaseMessage,
  mockBadges,
  mockModBadges,
  premiumBadge,
  stvChannelEmote1,
  stvGlobalEmote1,
} from './richChatMessageStoryFixtures';

const meta = {
  title: 'components/Chat/notices',
  component: RichChatMessage,
  decorators: [chatStoryDecorator],
  argTypes: {
    onReply: { action: 'onReply' },
  },
} satisfies Meta<typeof RichChatMessage>;

export default meta;

type Story = StoryObj<typeof meta>;
export const SubscriptionNotice: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'sub',
        subscriptionEvent: {
          msgId: 'sub',
          displayName: 'NewSubscriber',
          message: 'Thanks for subscribing!',
          plan: '1000',
          planName: 'Tier 1',
          months: 1,
        },
      },
    ]),
    notice_tags: {
      'msg-id': 'sub',
      'display-name': 'NewSubscriber',
      'msg-param-cumulative-months': '1',
      'msg-param-sub-plan': '1000',
      'msg-param-sub-plan-name': 'Tier 1',
      'msg-param-should-share-streak': '0',
      'msg-param-streak-months': '0',
    } as SubscriptionTags,
    onReply: () => {},
  },
};

export const ResubscriptionNotice: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'resub',
        subscriptionEvent: {
          msgId: 'resub',
          displayName: 'LoyalSubscriber',
          message: 'Keep up the great content!',
          plan: '2000',
          planName: 'Tier 2',
          months: 12,
          streakMonths: 6,
          shouldShareStreak: true,
        },
      },
    ]),
    notice_tags: {
      'msg-id': 'resub',
      'display-name': 'LoyalSubscriber',
      'msg-param-cumulative-months': '12',
      'msg-param-sub-plan': '2000',
      'msg-param-sub-plan-name': 'Tier 2',
      'msg-param-should-share-streak': '1',
      'msg-param-streak-months': '6',
    } as SubscriptionTags,
    onReply: () => {},
  },
};

export const AnonymousGiftPaidUpgrade: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'anongiftpaidupgrade',
        subscriptionEvent: {
          msgId: 'anongiftpaidupgrade',
          displayName: 'AnonymousGifter',
          promoName: 'Valorant',
          promoGiftTotal: '5',
        },
      },
    ]),
    notice_tags: {
      'msg-id': 'anongiftpaidupgrade',
      'display-name': 'AnonymousGifter',
      'msg-param-promo-name': 'Valorant',
      'msg-param-promo-gift-total': '5',
    },
    onReply: () => {},
  },
};

export const AnonymousGift: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'anongift',
        subscriptionEvent: {
          msgId: 'subgift',
          displayName: 'AnonymousGifter',
          plan: '1000',
          planName: 'Tier 1',
          recipientDisplayName: 'GiftRecipient',
          recipientId: '789',
          giftMonths: 3,
          months: 3,
        },
      },
    ]),
    notice_tags: {
      'msg-id': 'subgift',
      'display-name': 'AnonymousGifter',
      'msg-param-sub-plan': '1000',
      'msg-param-sub-plan-name': 'Tier 1',
      'msg-param-recipient-user-name': 'giftrecipient',
      'msg-param-recipient-display-name': 'GiftRecipient',
      'msg-param-recipient-id': '789',
      'msg-param-gift-months': '3',
      'msg-param-months': '3',
    },
    onReply: () => {},
  },
};

export const CommunityGiftNotice: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'submysterygift',
        subscriptionEvent: {
          msgId: 'submysterygift',
          displayName: 'MysteryGifter',
          plan: '2000',
          planName: 'Tier 1',
          massGiftCount: 5,
          senderCount: 42,
        },
      },
    ]),
    notice_tags: {
      'msg-id': 'submysterygift',
      'display-name': 'MysteryGifter',
      'msg-param-sub-plan': '2000',
      'msg-param-mass-gift-count': '5',
      'msg-param-sender-count': '42',
    },
    onReply: () => {},
  },
};

export const GiftPaidUpgrade: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'giftpaidupgrade',
        subscriptionEvent: {
          msgId: 'giftpaidupgrade',
          displayName: 'UpgradeUser',
          senderLogin: 'gifterlogin',
          senderName: 'GiftSender',
          promoName: 'Subtember',
          promoGiftTotal: '12',
        },
      },
    ]),
    notice_tags: {
      'msg-id': 'giftpaidupgrade',
      'display-name': 'UpgradeUser',
      'msg-param-sender-login': 'gifterlogin',
      'msg-param-sender-name': 'GiftSender',
      'msg-param-promo-name': 'Subtember',
      'msg-param-promo-gift-total': '12',
    },
    onReply: () => {},
  },
};

export const RaidNotice: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'text',
        content: '500 raiders from RaidLeader have joined!',
      },
    ]),
    sender: '',
    timestamp: '14:02',
    isTwitchSystemNotice: true,
    notice_tags: {
      'msg-id': 'raid',
      'display-name': 'RaidLeader',
      'msg-param-viewerCount': '500',
      'msg-param-login': 'raidleader',
      'msg-param-displayName': 'RaidLeader',
      'system-msg': '500 raiders from RaidLeader have joined!',
    },
    onReply: () => {},
  },
};

export const Announcement: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'this is an announcement to bait him',
        },
      ],
      {
        username: 'Gekon',
        'display-name': 'Gekon',
        login: 'gekon',
        color: '#FF5500',
        mod: '1',
      },
      [broadcasterBadge, premiumBadge],
    ),
    sender: 'Gekon',
    timestamp: '20:37',
    isAnnouncement: true,
    isSpecialNotice: true,
    notice_tags: {
      'msg-id': 'announcement',
      id: '55d90904-e515-47d0-ac1d-879f7f1d7b01',
      'msg-param-color': 'PRIMARY',
      'display-name': 'Gekon',
      login: 'gekon',
      color: '#FF5500',
      mod: '1',
      'user-id': '123456',
    } as AnnouncementTags,
    messageDisplay: {
      isAnnouncement: true,
      showTimestamp: true,
    },
    onReply: () => {},
  },
};

export const AnnouncementPurple: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'Event is starting in 20 minutes!',
        },
      ],
      {
        username: 'ModUser',
        'display-name': 'ModUser',
        login: 'moduser',
        color: '#00D9FF',
        mod: '1',
      },
      mockModBadges,
    ),
    sender: 'ModUser',
    timestamp: '21:00',
    isAnnouncement: true,
    isSpecialNotice: true,
    notice_tags: {
      'msg-id': 'announcement',
      'msg-param-color': 'PURPLE',
      'display-name': 'ModUser',
      login: 'moduser',
      mod: '1',
    } as AnnouncementTags,
    messageDisplay: {
      isAnnouncement: true,
      showTimestamp: true,
    },
    onReply: () => {},
  },
};

export const ViewerMilestone: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'viewermilestone',
        category: 'watch-streak',
        reward: '450',
        value: '20',
        content:
          'LimeTitanTV watched 20 consecutive streams and sparked a watch streak!',
        systemMsg:
          'LimeTitanTV\\swatched\\s20\\sconsecutive\\sstreams\\sand\\ssparked\\sa\\swatch\\sstreak!',
        login: 'limetitantv',
        displayName: 'LimeTitanTV',
      },
    ]),
    notice_tags: {
      'msg-id': 'viewermilestone',
      'msg-param-category': 'watch-streak',
      'msg-param-copoReward': '450',
      'msg-param-id': '123',
      'msg-param-value': '20',
      'display-name': 'LimeTitanTV',
    },
    onReply: () => {},
  },
};

export const StvEmoteAdded: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'stv_emote_added',
        stvEvents: {
          type: 'added',
          data: stvGlobalEmote1,
        },
      },
    ]),
    onReply: () => {},
  },
};

export const StvEmoteRemoved: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'stv_emote_removed',
        stvEvents: {
          type: 'removed',
          data: stvChannelEmote1,
        },
      },
    ]),
    onReply: () => {},
  },
};

export const HighlightMyMessage: Story = {
  args: {
    ...createBaseMessage(
      [{ type: 'text', content: 'hello world' }],
      {
        'display-name': 'Rexdain',
        username: 'Rexdain',
        login: 'rexdain',
        'msg-id': 'highlighted-message',
        'custom-reward-id': 'reward-highlight',
      },
      mockBadges,
    ),
    isChannelPointRedemption: true,
    isHighlightedMessage: true,
    onReply: () => {},
  },
};

export const ChannelPointRedemption: Story = {
  args: {
    ...createBaseMessage(
      [{ type: 'text', content: '你好' }],
      {
        'display-name': 'testUser',
        username: 'testUser',
        login: 'testuser',
        'room-id': '67890',
        'custom-reward-id': 'reward-tts',
        'msg-param-custom-reward-title': 'Chinese TTS',
      },
      mockBadges,
    ),
    isChannelPointRedemption: true,
    onReply: () => {},
  },
};

export const ChannelPointRedemptionSystemNotice: Story = {
  args: {
    ...createBaseMessage(
      [{ type: 'text', content: 'RewardUser redeemed Hydrate' }],
      {
        username: 'twitch',
        login: 'twitch',
      },
      [],
    ),
    isTwitchSystemNotice: true,
    onReply: () => {},
  },
};

export const CharityDonation: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'charitydonation',
        displayName: 'GenerousViewer',
        amount: '$25.00',
        currency: 'USD',
        charityName: 'Example Charity',
        systemMsg: '',
        message: 'Great cause!',
      },
    ]),
    onReply: () => {},
  },
};

export const NewChatterRitual: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'ritual',
        ritualName: 'new_chatter',
        displayName: 'FirstTimeChatter',
        systemMsg: '',
        message: '',
      },
    ]),
    onReply: () => {},
  },
};
