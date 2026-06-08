import type { ChatMessageType } from '@app/store/chat/types/constants';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { RichChatMessage } from './RichChatMessage';
import {
  chatterinoBadge,
  chatStoryDecorator,
  createBaseMessage,
  ffzModBadge,
  ffzVipBadge,
  mockBadges,
  mockModBadges,
  stvGlobalBaseEmote,
  stvGlobalEmote1,
  stvGlobalEmote2,
} from './richChatMessageStoryFixtures';

const meta = {
  title: 'components/Chat/messages',
  component: RichChatMessage,
  decorators: [chatStoryDecorator],
  argTypes: {
    onReply: { action: 'onReply' },
  },
} satisfies Meta<typeof RichChatMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

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
        site: 'Twitch Channel',
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
        site: 'Twitch Channel',
      },
      {
        type: 'text',
        content: '!',
      },
    ]),
    onReply: () => {},
  },
};

export const ZeroWidthSevenTv: Story = {
  args: {
    ...createBaseMessage([
      {
        type: 'text',
        content: 'classic 7TV stack ',
      },
      {
        type: 'emote',
        content: stvGlobalBaseEmote.name,
        original_name: stvGlobalBaseEmote.original_name,
        name: stvGlobalBaseEmote.name,
        id: stvGlobalBaseEmote.id,
        url: stvGlobalBaseEmote.url,
        static_url: stvGlobalBaseEmote.static_url,
        site: stvGlobalBaseEmote.site,
        width: stvGlobalBaseEmote.width,
        height: stvGlobalBaseEmote.height,
        aspect_ratio: stvGlobalBaseEmote.aspect_ratio,
        zero_width: false,
      },
      {
        type: 'emote',
        content: stvGlobalEmote1.name,
        original_name: stvGlobalEmote1.original_name,
        name: stvGlobalEmote1.name,
        id: stvGlobalEmote1.id,
        url: stvGlobalEmote1.url,
        static_url: stvGlobalEmote1.static_url,
        site: stvGlobalEmote1.site,
        width: stvGlobalEmote1.width,
        height: stvGlobalEmote1.height,
        aspect_ratio: stvGlobalEmote1.aspect_ratio,
        zero_width: stvGlobalEmote1.zero_width,
      },
      {
        type: 'emote',
        content: stvGlobalEmote2.name,
        original_name: stvGlobalEmote2.original_name,
        name: stvGlobalEmote2.name,
        id: stvGlobalEmote2.id,
        url: stvGlobalEmote2.url,
        static_url: stvGlobalEmote2.static_url,
        site: stvGlobalEmote2.site,
        width: stvGlobalEmote2.width,
        height: stvGlobalEmote2.height,
        aspect_ratio: stvGlobalEmote2.aspect_ratio,
        zero_width: stvGlobalEmote2.zero_width,
      },
      {
        type: 'text',
        content: ' on one line',
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
      { color: '#1AC9A2' },
    ),
    onReply: () => {},
  },
  render: args => {
    const allMessages: ChatMessageType<never>[] = [
      createBaseMessage([{ type: 'text', content: 'Previous message' }], {
        username: 'streamer',
        'display-name': 'Streamer',
        color: '#0000FF',
      }),
      createBaseMessage([{ type: 'text', content: 'Another message' }], {
        username: 'viewer',
        'display-name': 'Viewer',
        color: '#FF00FF',
      }),
    ];
    return (
      // @ts-expect-error - allMessages is a valid prop but not in Storybook's type definition
      <RichChatMessage {...args} allMessages={allMessages} />
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
          site: 'Twitch Channel',
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
      <RichChatMessage
        {...createBaseMessage([{ type: 'text', content: 'Red user message' }], {
          username: 'RedUser',
          color: '#FF0000',
        })}
        onReply={() => {}}
      />
      <RichChatMessage
        {...createBaseMessage(
          [{ type: 'text', content: 'Blue user message' }],
          { username: 'BlueUser', color: '#0000FF' },
        )}
        onReply={() => {}}
      />
      <RichChatMessage
        {...createBaseMessage(
          [{ type: 'text', content: 'Teal user message' }],
          { username: 'TealUser', color: '#1AC9A2' },
        )}
        onReply={() => {}}
      />
      <RichChatMessage
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

export const ChatterinoSplit: Story = {
  args: {
    ...createBaseMessage([{ type: 'text', content: 'placeholder' }]),
    onReply: () => {},
  },
  render: () => {
    const splitMessages: ChatMessageType<'userstate'>[] = [
      {
        ...createBaseMessage(
          [{ type: 'text', content: 'forsenCD teaTime' }],
          {
            username: 'modUser',
            'display-name': 'ModUser',
            color: '#00D9FF',
            mod: '1',
          },
          mockModBadges,
        ),
        timestamp: '13:37',
      },
      {
        ...createBaseMessage(
          [
            { type: 'text', content: 'hello ' },
            { type: 'mention', content: '@testuser' },
            {
              type: 'text',
              content: ' this line should read like a dense split row',
            },
          ],
          {
            username: 'firstTimer',
            'display-name': 'FirstTimer',
            color: '#9ACD32',
            'first-msg': '1',
          },
        ),
        timestamp: '13:38',
      },
      {
        ...createBaseMessage(
          [
            {
              type: 'text',
              content:
                'reply chains need to stay inline instead of turning into cards',
            },
          ],
          {
            username: 'replyUser',
            'display-name': 'ReplyUser',
            color: '#D269FF',
          },
        ),
        parentDisplayName: 'OriginalUser',
        replyBody: 'the original line being replied to',
        replyDisplayName: 'OriginalUser',
        timestamp: '13:39',
      },
      {
        ...createBaseMessage(
          [
            {
              type: 'text',
              content:
                'longer messages should wrap naturally without clipping even when the line gets verbose and carries on for a while with a couple of emotes ',
            },
            {
              type: 'emote',
              content: 'Kappa',
              original_name: 'Kappa',
              name: 'Kappa',
              id: '25',
              url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0',
              site: 'Twitch Channel',
            },
            { type: 'text', content: ' and still remain readable.' },
          ],
          {
            username: 'wrapTester',
            'display-name': 'WrapTester',
            color: '#FF6B6B',
          },
          mockBadges,
        ),
        timestamp: '13:40',
      },
      {
        ...createBaseMessage(
          [{ type: 'text', content: 'Now hosting somechannel' }],
          {},
        ),
        sender: 'system',
        timestamp: '13:41',
      },
    ];

    return (
      <View style={{ gap: 2 }}>
        {splitMessages.map(message => (
          <RichChatMessage
            key={message.id}
            {...message}
            currentUsername='testuser'
            currentUsernameNormalized='testuser'
            density='compact'
            showTimestamp
            onReply={() => {}}
          />
        ))}
      </View>
    );
  },
};
