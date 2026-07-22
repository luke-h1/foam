import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { Link, List, Section, Text } from './Form';

const meta = {
  title: 'components/Form',
  component: List,
  decorators: [
    Story => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof List>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sections: Story = {
  args: {
    children: (
      <>
        <Section title='Account'>
          <Text systemImage='person.crop.circle'>Profile</Text>
          <Text systemImage='bell' hint='Enabled'>
            Notifications
          </Text>
        </Section>
        <Section title='About' footer='Build details for this install.'>
          <Text hint='1.0.4'>Version</Text>
          <Link systemImage='safari' onPress={() => {}}>
            <Text>Open website</Text>
          </Link>
        </Section>
      </>
    ),
  },
};

export const Grouped: Story = {
  args: {
    listStyle: 'grouped',
    children: (
      <Section title='Playback'>
        <Text hint='Auto'>Quality</Text>
        <Text hintBoolean>Background audio</Text>
      </Section>
    ),
  },
};
