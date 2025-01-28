import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { BlurImage } from './BlurImage';

const meta = {
  title: 'components/BlurImage',
  component: BlurImage,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof BlurImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    source: { uri: 'https://placecats.com/millie/300/150' },
  },
};

export const CustomPlaceholder: Story = {
  args: {
    source: { uri: 'https://placecats.com/millie/300/150' },
    placeholder:
      '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[',
  },
};

export const CustomContentFit: Story = {
  args: {
    source: { uri: 'https://placecats.com/millie/300/150' },
    contentFit: 'contain',
  },
};
