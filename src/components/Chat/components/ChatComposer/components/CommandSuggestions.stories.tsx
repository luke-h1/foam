import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import { SLASH_COMMAND_DEFINITIONS } from '@app/components/Chat/util/slashCommandDefinitions/SLASH_COMMAND_DEFINITIONS';

import { CommandSuggestions } from './CommandSuggestions';

const meta = {
  title: 'components/Chat/ChatComposer/CommandSuggestions',
  component: CommandSuggestions,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          justifyContent: 'flex-end',
          padding: 16,
        }}
      >
        <Story />
      </View>
    ),
  ],
  argTypes: {
    handleCommandSelect: { action: 'handleCommandSelect' },
  },
  args: {
    commands: SLASH_COMMAND_DEFINITIONS.slice(0, 6),
    handleCommandSelect: () => {},
  },
} satisfies Meta<typeof CommandSuggestions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleCommand: Story = {
  args: {
    commands: SLASH_COMMAND_DEFINITIONS.slice(0, 1),
  },
};
