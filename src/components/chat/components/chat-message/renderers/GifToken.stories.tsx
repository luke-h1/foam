import { View } from 'react-native';
import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { ChatRow } from '../ChatRow';
import {
  chatStoryDecorator,
  createBaseMessage,
  mockBadges,
} from '../ChatRowStoryFixtures';
import { getChatTextStyles } from '../ChatText.styles';
import { getChatScale } from '../util/chatScale';
import {
  createRowVisibilityStore,
  RowVisibilityContext,
} from '../util/rowVisibility';
import { GifToken } from './GifToken';

const EXAMPLE_GIF_URL =
  'https://media4.giphy.com/media/joSNxeswxuc74Juo8X/giphy.gif?cid=095d7a5dzizsiwgabonagkmigggv8v1spfai91ac3x0dsiy0&ep=v1_gifs_trending&rid=giphy.gif&ct=g';

const EXAMPLE_GIF_CONTENT = '[Y A Y Yes GIF by Djemilah Birnie]';

const scale = getChatScale('default', 'comfortable');
const textStyles = getChatTextStyles('default', false);
const storyVisibility = createRowVisibilityStore(true);

const gifTokenDecorator = (Story: () => ReactNode) => (
  <View
    style={{
      flex: 1,
      backgroundColor: '#0E0E10',
      padding: 16,
      justifyContent: 'flex-start',
    }}
  >
    <RowVisibilityContext.Provider value={storyVisibility}>
      <Story />
    </RowVisibilityContext.Provider>
  </View>
);

const meta = {
  title: 'components/Chat/messages/gif',
  component: GifToken,
  decorators: [gifTokenDecorator],
} satisfies Meta<typeof GifToken>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    targetSize: scale.gifSize,
    textStyles,
    token: {
      type: 'gif',
      content: EXAMPLE_GIF_CONTENT,
      gifId: 'joSNxeswxuc74Juo8X',
      url: EXAMPLE_GIF_URL,
    },
  },
};

export const AnimationsDisabled: Story = {
  args: {
    ...Default.args,
    disableAnimations: true,
  },
};

export const Moderated: Story = {
  args: {
    ...Default.args,
    isModerated: true,
  },
};

export const MissingUrl: Story = {
  args: {
    targetSize: scale.gifSize,
    textStyles,
    token: {
      type: 'gif',
      content: EXAMPLE_GIF_CONTENT,
      gifId: 'joSNxeswxuc74Juo8X',
      url: '',
    },
  },
};

export const InMessage: Story = {
  args: Default.args,
  decorators: [chatStoryDecorator],
  render: () => (
    <ChatRow
      {...createBaseMessage(
        [
          { type: 'text', content: 'look at this ' },
          {
            type: 'gif',
            content: EXAMPLE_GIF_CONTENT,
            gifId: 'joSNxeswxuc74Juo8X',
            url: EXAMPLE_GIF_URL,
          },
        ],
        { color: '#FF6B6B' },
        mockBadges,
      )}
      onReply={() => {}}
    />
  ),
};

export const MidMessage: Story = {
  args: Default.args,
  decorators: [chatStoryDecorator],
  render: () => (
    <ChatRow
      {...createBaseMessage(
        [
          { type: 'text', content: 'chat said ' },
          {
            type: 'gif',
            content: 'world',
            gifId: 'abc123',
            url: EXAMPLE_GIF_URL,
          },
          { type: 'text', content: ' and then kept going' },
        ],
        {
          color: '#1AC9A2',
          username: 'gifposter',
          'display-name': 'GifPoster',
        },
        mockBadges,
      )}
      onReply={() => {}}
    />
  ),
};

export const InChat: Story = {
  args: Default.args,
  decorators: [chatStoryDecorator],
  render: () => (
    <View style={{ gap: 8 }}>
      <ChatRow
        {...createBaseMessage(
          [{ type: 'text', content: 'anyone got a reaction image' }],
          {
            username: 'chatter',
            'display-name': 'Chatter',
            color: '#9B59B6',
          },
        )}
        onReply={() => {}}
      />
      <ChatRow
        {...createBaseMessage(
          [
            { type: 'text', content: 'this one ' },
            {
              type: 'gif',
              content: EXAMPLE_GIF_CONTENT,
              gifId: 'joSNxeswxuc74Juo8X',
              url: EXAMPLE_GIF_URL,
            },
          ],
          {
            username: 'gifposter',
            'display-name': 'GifPoster',
            color: '#FF6B6B',
          },
          mockBadges,
        )}
        onReply={() => {}}
      />
      <ChatRow
        {...createBaseMessage([{ type: 'text', content: 'lmao perfect' }], {
          username: 'chatter',
          'display-name': 'Chatter',
          color: '#9B59B6',
        })}
        onReply={() => {}}
      />
    </View>
  ),
};
