import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { getChatTextStyles } from '../chat-text.styles';
import { getChatScale } from '../util/chat-scale';
import {
  createRowVisibilityStore,
  RowVisibilityContext,
} from '../util/row-visibility';
import { GifToken } from './gif-token';

const EXAMPLE_GIF_URL =
  'https://media4.giphy.com/media/joSNxeswxuc74Juo8X/giphy.gif?cid=095d7a5dzizsiwgabonagkmigggv8v1spfai91ac3x0dsiy0&ep=v1_gifs_trending&rid=giphy.gif&ct=g';

const EXAMPLE_GIF_CONTENT = '[Y A Y Yes GIF by Djemilah Birnie]';

const scale = getChatScale('default', 'comfortable');
const textStyles = getChatTextStyles('default', false);
const storyVisibility = createRowVisibilityStore(true);

const meta = {
  title: 'components/Chat/GifToken',
  component: GifToken,
  decorators: [
    Story => (
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
    ),
  ],
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
