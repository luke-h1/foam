import type { Meta, StoryObj } from '@storybook/react';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { chatStoryDecorator } from '../ChatMessage/richChatMessageStoryFixtures';
import { ViewerMileStoneNoticeComponent } from './ViewerMilestoneNotice';

const watchStreakPart: ParsedPart<'viewermilestone'> = {
  type: 'viewermilestone',
  category: 'watch-streak',
  reward: '350',
  value: '20',
  content: 'let him cook',
  systemMsg:
    'LoyalViewer watched 20 consecutive streams and sparked a watch streak!',
  login: 'loyalviewer',
  displayName: 'LoyalViewer',
};

const meta = {
  title: 'components/Chat/usernotices/ViewerMilestoneNotice',
  component: ViewerMileStoneNoticeComponent,
  decorators: [chatStoryDecorator],
} satisfies Meta<typeof ViewerMileStoneNoticeComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WatchStreak: Story = {
  args: {
    part: watchStreakPart,
  },
};

export const GenericMilestone: Story = {
  args: {
    part: {
      type: 'viewermilestone',
      category: 'follow',
      reward: '0',
      value: '1',
      content: '',
      systemMsg: 'NewFan just reached a follow milestone!',
      login: 'newfan',
      displayName: 'NewFan',
    },
  },
};
