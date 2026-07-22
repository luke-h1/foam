import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { EditorialSectionHeader } from './EditorialSectionHeader';

const meta = {
  title: 'components/EditorialSectionHeader',
  component: EditorialSectionHeader,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof EditorialSectionHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    eyebrow: 'Following',
    title: 'Live channels',
    subtitle: 'Streams from channels you follow, sorted by viewer count.',
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Top categories',
  },
};
