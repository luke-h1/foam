import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { CheermoteRenderer } from './CheermoteRenderer';

const cheer100Part: ParsedPart<'cheermote'> = {
  type: 'cheermote',
  content: 'Cheer100',
  cheermote: {
    bits: 100,
    color: '#9c3ee8',
    prefix: 'Cheer',
    static_url:
      'https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/static/100/2.png',
    url: 'https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/100/2.gif',
  },
};

const noUrlPart: ParsedPart<'cheermote'> = {
  type: 'cheermote',
  content: 'Cheer1',
  cheermote: {
    bits: 1,
    color: '#979797',
    prefix: 'Cheer',
    static_url: '',
    url: '',
  },
};

const meta = {
  title: 'components/Chat/ChatMessage/CheermoteRenderer',
  component: CheermoteRenderer,
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof CheermoteRenderer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Animated: Story = {
  args: {
    part: cheer100Part,
  },
};

export const Static: Story = {
  args: {
    part: cheer100Part,
    disableAnimations: true,
  },
};

export const Moderated: Story = {
  args: {
    part: cheer100Part,
    isModerated: true,
  },
};

export const TextFallback: Story = {
  args: {
    part: noUrlPart,
  },
};
