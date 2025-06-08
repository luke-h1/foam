import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import RNToast from 'react-native-toast-message';
import { Button } from '../Button';
import { Typography } from '../Typography';
import { Toast } from './Toast';

const meta = {
  title: 'components/Toast',
  component: Toast,
  decorators: [
    Story => (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <Button
        onPress={() => {
          RNToast.show({
            type: 'success',
            text1: 'Hello',
            text2: 'This is a toast message',
          });
        }}
      >
        <Typography>Show toast</Typography>
      </Button>
      <Toast />
    </>
  ),
};
