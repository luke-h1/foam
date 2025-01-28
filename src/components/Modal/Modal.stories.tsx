/* eslint-disable no-alert */
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Modal } from './Modal';

const meta = {
  title: 'components/Modal',
  component: Modal,
  decorators: [
    Story => (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Modal Title',
    subtitle: 'This is a subtitle',
    isVisible: true,
    confirmOnPress: {
      cta: () => alert('Confirmed'),
      label: 'Confirm',
    },
    cancelOnPress: {
      cta: () => alert('Cancelled'),
      label: 'Cancel',
    },
  },
};

export const WithoutSubtitle: Story = {
  args: {
    title: 'Modal Title',
    isVisible: true,
    confirmOnPress: {
      cta: () => alert('Confirmed'),
      label: 'Confirm',
    },
    cancelOnPress: {
      cta: () => alert('Cancelled'),
      label: 'Cancel',
    },
  },
};
