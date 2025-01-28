import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { CategoryCard } from './CategoryCard';

const meta = {
  title: 'components/CategoryCard',
  component: CategoryCard,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof CategoryCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    category: {
      id: '1',
      name: 'Category Name',
      box_art_url: 'https://placecats.com/300/200',
      igdb_id: '1',
    },
  },
};
