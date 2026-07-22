import type { Meta, StoryObj } from '@storybook/react';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import {
  chatStoryDecorator,
  stvGlobalBaseEmote,
} from '../ChatMessage/richChatMessageStoryFixtures';
import { SubscriptionNotice } from './SubscriptionNotice';

const newSubPart: ParsedPart<'sub'> = {
  type: 'sub',
  subscriptionEvent: {
    msgId: 'sub',
    displayName: 'NewSubscriber',
    plan: '1000',
    planName: 'Tier 1',
  },
};

const resubPart: ParsedPart<'resub'> = {
  type: 'resub',
  subscriptionEvent: {
    msgId: 'resub',
    displayName: 'LoyalViewer',
    message: 'best community on Twitch',
    plan: '1000',
    planName: 'Tier 1',
    months: 24,
    streakMonths: 12,
    shouldShareStreak: true,
  },
};

const mysteryGiftPart: ParsedPart<'submysterygift'> = {
  type: 'submysterygift',
  subscriptionEvent: {
    msgId: 'submysterygift',
    displayName: 'GiftMachine',
    plan: '1000',
    planName: 'Tier 1',
    massGiftCount: 10,
    senderCount: 55,
  },
};

const primePart: ParsedPart<'sub'> = {
  type: 'sub',
  subscriptionEvent: {
    msgId: 'sub',
    displayName: 'PrimeUser',
    plan: 'Prime',
    planName: 'Prime',
  },
};

const meta = {
  title: 'components/Chat/usernotices/SubscriptionNotice',
  component: SubscriptionNotice,
  decorators: [chatStoryDecorator],
} satisfies Meta<typeof SubscriptionNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NewSub: Story = {
  args: {
    part: newSubPart,
  },
};

export const ResubWithMessage: Story = {
  args: {
    part: resubPart,
    parsedMessage: [
      { type: 'text', content: 'best community on Twitch ' },
      {
        type: 'emote',
        content: stvGlobalBaseEmote.name,
        id: stvGlobalBaseEmote.id,
        name: stvGlobalBaseEmote.name,
        url: stvGlobalBaseEmote.url,
        static_url: stvGlobalBaseEmote.static_url,
        site: stvGlobalBaseEmote.site,
      },
    ],
  },
};

export const MysteryGift: Story = {
  args: {
    part: mysteryGiftPart,
  },
};

export const PrimeSub: Story = {
  args: {
    part: primePart,
  },
};
