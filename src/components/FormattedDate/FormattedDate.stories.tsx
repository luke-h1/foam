import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { FormattedDate } from './FormattedDate';

const meta = {
  title: 'components/FormattedDate',
  component: FormattedDate,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof FormattedDate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: new Date(),
  },
};

export const CustomFormat: Story = {
  args: {
    children: new Date(),
    format: 'yyyy-MM-dd',
  },
};

export const RelativeToNow: Story = {
  args: {
    children: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    formatRelativeToNow: true,
  },
};

export const WithParseFormat: Story = {
  args: {
    children: '2023-10-01',
    parseFormat: 'yyyy-MM-dd',
  },
};
