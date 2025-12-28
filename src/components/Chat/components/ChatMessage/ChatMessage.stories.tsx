/* eslint-disable camelcase */
import { ffzSanitiisedChannelBadges } from '@app/services/__fixtures__/badges/ffz/ffzSanitisedChannelBadges.fixture';
import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedGlobalBadges.fixture';
import { sevenTvSanitisedChannelEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedChannelEmoteSet.fixture';
import { seventvSanitiisedGlobalEmoteSetFixture } from '@app/services/__fixtures__/emotes/stv/sevenTvSanitisedGlobalEmoteSet.fixture';
import { chatterinoService } from '@app/services/chatterino-service';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { ChatMessageType } from '@app/store/chatStore';
import { SubscriptionTags } from '@app/types/chat/irc-tags/usernotice';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import type { Meta, StoryObj } from '@storybook/react';
import { View, ScrollView } from 'react-native';
import { ChatMessage } from './ChatMessage';

const meta = {
  title: 'components/Chat/ChatMessage',
  component: ChatMessage,
  decorators: [
    Story => (
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          padding: 16,
        }}
      >
        <View style={{ maxWidth: 600, width: '100%' }}>
          <Story />
        </View>
      </ScrollView>
    ),
  ],
  argTypes: {
    onReply: { action: 'onReply' },
  },
} satisfies Meta<typeof ChatMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

const stvGlobalEmote1 = seventvSanitiisedGlobalEmoteSetFixture[0];
const stvGlobalEmote2 = seventvSanitiisedGlobalEmoteSetFixture[1];
const stvChannelEmote1 = sevenTvSanitisedChannelEmoteSetFixture[0];

if (!stvGlobalEmote1 || !stvGlobalEmote2 || !stvChannelEmote1) {
  throw new Error('7TV emote fixtures are missing required emotes');
}

const createBaseMessage = (
  message: ParsedPart[],
  userstate: Partial<UserStateTags> = {},
  badges: SanitisedBadgeSet[] = [],
): ChatMessageType<'userstate'> => {
  const message_id = 'msg-123';
  const message_nonce = 'nonce-123';
  return {
    id: `${message_id}_${message_nonce}`,
    userstate: {
      username: 'testuser',
      'display-name': 'TestUser',
      login: 'testuser',
      color: '#FF0000',
      'user-id': '123456',
      ...userstate,
    } as UserStateTags,
    message,
    badges,
    channel: 'testchannel',
    message_id,
    message_nonce,
    sender: 'testuser',
    replyDisplayName: '',
    replyBody: '',
  };
};

const subscriberBadge = twitchSanitisedGlobalBadges.find(
  badge => badge.id === 'subscriber_0',
);
const premiumBadge = twitchSanitisedGlobalBadges.find(
  badge => badge.id === 'premium_1',
);
const moderatorBadge = twitchSanitisedGlobalBadges.find(
  badge => badge.id === 'moderator_1',
);

if (!subscriberBadge || !premiumBadge || !moderatorBadge) {
  throw new Error('Required badge fixtures are missing');
}

const mockBadges: SanitisedBadgeSet[] = [subscriberBadge, premiumBadge];

const mockModBadges: SanitisedBadgeSet[] = [moderatorBadge];

const ffzVipBadge = ffzSanitiisedChannelBadges.find(
  badge => badge.id === 'vip_badge',
);
const ffzModBadge = ffzSanitiisedChannelBadges.find(
  badge => badge.id === 'mod_badge',
);
const chatterinoBadges = chatterinoService.listSanitisedBadges();
const chatterinoBadge = chatterinoBadges[0];

if (!ffzVipBadge || !ffzModBadge || !chatterinoBadge) {
  throw new Error('Required badge fixtures are missing');
}

export const BasicText: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'text',
        content: 'Hello, this is a basic chat message!',
      },
    ]),
    onReply: () => {},
  },
};

export const WithEmotes: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'text',
        content: 'Check out this emote ',
      },
      {
        type: 'emote',
        content: 'Kappa',
        original_name: 'Kappa',
        name: 'Kappa',
        id: '25',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
        site: 'twitch',
      },
      {
        type: 'text',
        content: ' and this one ',
      },
      {
        type: 'emote',
        content: 'PogChamp',
        original_name: 'PogChamp',
        name: 'PogChamp',
        id: '305954156',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/1.0',
        site: 'twitch',
      },
      {
        type: 'text',
        content: '!',
      },
    ]),
    onReply: () => {},
  },
};

export const WithMentions: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'Hey ',
        },
        {
          type: 'mention',
          content: '@streamer',
        },
        {
          type: 'text',
          content: ' and ',
        },
        {
          type: 'mention',
          content: '@viewer',
        },
        {
          type: 'text',
          content: ', check this out!',
        },
      ],
      { color: '#00FF00' },
    ),
    onReply: () => {},
  },
  render: args => {
    const allMessages: ChatMessageType<never>[] = [
      createBaseMessage([{ type: 'text', content: 'Previous message' }], {
        username: 'streamer',
        'display-name': 'Streamer',
        color: '#0000FF',
      }) as ChatMessageType<never>,
      createBaseMessage([{ type: 'text', content: 'Another message' }], {
        username: 'viewer',
        'display-name': 'Viewer',
        color: '#FF00FF',
      }) as ChatMessageType<never>,
    ];
    return (
      // @ts-expect-error - allMessages is a valid prop but not in Storybook's type definition
      <ChatMessage {...args} allMessages={allMessages} />
    );
  },
};

export const WithBadges: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'I have subscriber and premium badges!',
        },
      ],
      { color: '#FF6B6B' },
      mockBadges,
    ),
    onReply: () => {},
  },
};

export const ModeratorMessage: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'This is a moderator message with special badges.',
        },
      ],
      { color: '#00D9FF', mod: '1' },
      mockModBadges,
    ),
    onReply: () => {},
  },
};

export const FfzVipBadge: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'This message has an FFZ VIP badge!',
        },
      ],
      { color: '#FF6B6B' },
      [ffzVipBadge],
    ),
    onReply: () => {},
  },
};

export const FfzModBadge: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'This message has an FFZ Moderator badge!',
        },
      ],
      { color: '#00D9FF' },
      [ffzModBadge],
    ),
    onReply: () => {},
  },
};

export const ChatterinoBadge: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'This message has a Chatterino badge!',
        },
      ],
      { color: '#9B59B6' },
      [chatterinoBadge],
    ),
    onReply: () => {},
  },
};

export const FirstMessage: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'This is my first message in this channel!',
        },
      ],
      { 'first-msg': '1', color: '#FFD700' },
    ),
    onReply: () => {},
  },
};

export const ReplyMessage: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'This is a reply to another message.',
        },
      ],
      { color: '#9B59B6' },
    ),
    parentDisplayName: 'OriginalUser',
    parentColor: '#3498DB',
    replyBody: 'The original message that was replied to',
    replyDisplayName: 'OriginalUser',
    onReply: () => {},
  },
};

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

export const StvEmoteLink: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'text',
        content: 'Check out this STV emote: ',
      },
      {
        type: 'stvEmote',
        content: stvGlobalEmote2.emote_link,
        url: stvGlobalEmote2.url,
        name: stvGlobalEmote2.name,
        site: stvGlobalEmote2.site,
        original_name: stvGlobalEmote2.original_name,
        id: stvGlobalEmote2.id,
        creator: stvGlobalEmote2.creator,
        emote_link: stvGlobalEmote2.emote_link,
      },
    ]),
    onReply: () => {},
  },
};

export const TwitchClip: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'text',
        content: 'Check out this clip: ',
      },
      {
        type: 'twitchClip',
        content: 'https://clips.twitch.tv/CoolClip',
        url: 'https://clips.twitch.tv/CoolClip',
        thumbnail: 'https://clips-media-assets2.twitch.tv/CoolClip-preview.jpg',
      },
    ]),
    onReply: () => {},
  },
};

export const ComplexMessage: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'Hey ',
        },
        {
          type: 'mention',
          content: '@everyone',
        },
        {
          type: 'text',
          content: ' check this out ',
        },
        {
          type: 'emote',
          content: 'PogChamp',
          original_name: 'PogChamp',
          name: 'PogChamp',
          id: '305954156',
          url: 'https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/1.0',
          site: 'twitch',
        },
        {
          type: 'text',
          content: '!',
        },
      ],
      { color: '#FF1493', 'first-msg': '1' },
      mockBadges,
    ),
    onReply: () => {},
  },
};

export const DifferentColors: Story = {
  args: {
    ...createBaseMessage([{ type: 'text', content: 'Placeholder' }]),
    onReply: () => {},
  },
  render: () => (
    <View style={{ gap: 16 }}>
      <ChatMessage
        {...createBaseMessage([{ type: 'text', content: 'Red user message' }], {
          username: 'RedUser',
          color: '#FF0000',
        })}
        onReply={() => {}}
      />
      <ChatMessage
        {...createBaseMessage(
          [{ type: 'text', content: 'Blue user message' }],
          { username: 'BlueUser', color: '#0000FF' },
        )}
        onReply={() => {}}
      />
      <ChatMessage
        {...createBaseMessage(
          [{ type: 'text', content: 'Green user message' }],
          { username: 'GreenUser', color: '#00FF00' },
        )}
        onReply={() => {}}
      />
      <ChatMessage
        {...createBaseMessage(
          [{ type: 'text', content: 'Purple user message' }],
          { username: 'PurpleUser', color: '#9B59B6' },
        )}
        onReply={() => {}}
      />
    </View>
  ),
};

export const LongMessage: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'text',
        content:
          'This is a very long message that should wrap properly in the chat interface. It contains multiple sentences and should demonstrate how the component handles longer text content. The message should flow naturally and maintain readability even when it spans multiple lines.',
      },
    ]),
    onReply: () => {},
  },
};

export const NoUsername: Story = {
  args: {
    ...createBaseMessage(
      [
        {
          type: 'text',
          content: 'This message has no username displayed.',
        },
      ],
      { username: undefined, 'display-name': undefined },
    ),
    onReply: () => {},
  },
};
