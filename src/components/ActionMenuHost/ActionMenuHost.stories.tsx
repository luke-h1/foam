import { useEffect } from 'react';
import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import {
  dismissActionMenu,
  presentActionMenu,
} from '@app/store/overlays/actionMenuStore';

import { ActionMenuHost } from './ActionMenuHost';

function PresentedActionMenu() {
  useEffect(() => {
    presentActionMenu({
      title: 'Message actions',
      cancelLabel: 'Cancel',
      actions: [
        { label: 'Reply', onPress: () => {} },
        { label: 'Copy text', onPress: () => {} },
        { label: 'Delete message', onPress: () => {} },
      ],
    });

    return () => {
      dismissActionMenu();
    };
  }, []);

  return <ActionMenuHost />;
}

const meta = {
  title: 'components/ActionMenuHost',
  component: ActionMenuHost,
  decorators: [
    Story => (
      <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ActionMenuHost>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <PresentedActionMenu />,
};
