import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { Text } from '@app/components/ui/Text/Text';

import {
  SettingsLinkRow,
  SettingsRow,
  SettingsSection,
  SettingsToggleRow,
} from './SettingsSection';

const meta = {
  title: 'components/SettingsSection',
  component: SettingsSection,
  decorators: [
    Story => (
      <View style={{ padding: 16, justifyContent: 'flex-start' }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SettingsSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Chat',
    children: (
      <>
        <SettingsToggleRow
          title='Timestamps'
          subtitle='Show a timestamp next to each message'
          icon={{ icon: 'clock' }}
          value
          onValueChange={() => {}}
        />
        <SettingsLinkRow
          title='Blocked terms'
          icon={{ icon: 'hand.raised' }}
          value='4'
          onPress={() => {}}
        />
        <SettingsRow
          title='Saved phrases'
          subtitle='Quick replies for the composer'
          icon={{ icon: 'bookmark' }}
          onPress={() => {}}
        />
      </>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Account',
    footer: (
      <Text type='xs' color='gray.textLow'>
        Logging out clears cached credentials on this device.
      </Text>
    ),
    children: (
      <SettingsRow
        title='Log out'
        icon={{ icon: 'rectangle.portrait.and.arrow.right', color: '#FF453A' }}
        danger
        onPress={() => {}}
      />
    ),
  },
};
