import type { Meta, StoryObj } from '@storybook/react';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { chatStoryDecorator } from '../ChatMessage/richChatMessageStoryFixtures';
import { RitualNotice } from './RitualNotice';

const newChatterPart: ParsedPart<'ritual'> = {
  type: 'ritual',
  displayName: 'FreshFace',
  ritualName: 'new_chatter',
  systemMsg: '',
  message: 'HeyGuys',
};

const meta = {
  title: 'components/Chat/usernotices/RitualNotice',
  component: RitualNotice,
  decorators: [chatStoryDecorator],
} satisfies Meta<typeof RitualNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NewChatter: Story = {
  args: {
    part: newChatterPart,
  },
};

export const CustomRitual: Story = {
  args: {
    part: {
      type: 'ritual',
      displayName: 'LoyalFan',
      ritualName: 'celebration_dance',
      systemMsg: '',
    },
  },
};

export const WithSystemMessage: Story = {
  args: {
    part: {
      ...newChatterPart,
      systemMsg: 'FreshFace is new here. Say hello!',
    },
  },
};
