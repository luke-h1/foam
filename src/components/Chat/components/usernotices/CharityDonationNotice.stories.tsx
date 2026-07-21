import type { Meta, StoryObj } from '@storybook/react';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { chatStoryDecorator } from '../ChatMessage/richChatMessageStoryFixtures';
import { CharityDonationNotice } from './CharityDonationNotice';

const basePart: ParsedPart<'charitydonation'> = {
  type: 'charitydonation',
  displayName: 'GenerousViewer',
  charityName: 'Stand Up To Cancer',
  amount: '$50.00',
  currency: 'USD',
  systemMsg: 'GenerousViewer donated $50.00 to Stand Up To Cancer.',
};

const meta = {
  title: 'components/Chat/usernotices/CharityDonationNotice',
  component: CharityDonationNotice,
  decorators: [chatStoryDecorator],
} satisfies Meta<typeof CharityDonationNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    part: basePart,
  },
};

export const WithMessage: Story = {
  args: {
    part: {
      ...basePart,
      message: 'Keep up the great work everyone!',
    },
  },
};
