import type { Meta, StoryObj } from '@storybook/react';
import { View, Button } from 'react-native';
import RNToast from 'react-native-toast-message';
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
        title="Show Toast"
        onPress={() => {
          RNToast.show({
            type: 'success',
            text1: 'Hello',
            text2: 'This is a toast message',
          });
        }}
      />
      <Toast />
    </>
  ),
};
