import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react';

import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { ReplyingToHeader } from './ReplyingToHeader';
import type { UseChatMessagePartRendererArgs } from './useChatMessagePartRenderer';

const rendererArgs: UseChatMessagePartRendererArgs = {
  compact: false,
  disableEmoteAnimations: true,
  getPartKey: (part: ParsedPart, index: number) => `${part.type}-${index}`,
  message: [],
};

const meta = {
  title: 'components/Chat/ChatMessage/ReplyingToHeader',
  component: ReplyingToHeader,
  decorators: [
    Story => (
      <View style={{ backgroundColor: '#0E0E10', flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  args: {
    compact: false,
    rendererArgs,
  },
  argTypes: {
    onReplyContextPress: { action: 'onReplyContextPress' },
  },
} satisfies Meta<typeof ReplyingToHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ReplyingToUser: Story = {
  args: {
    canJumpToReplyTarget: false,
    isReplyingToCurrentUser: false,
    parentDisplayName: 'OriginalUser',
    replyBody: 'The original message that was replied to',
  },
};

export const ReplyingToYou: Story = {
  args: {
    canJumpToReplyTarget: false,
    isReplyingToCurrentUser: true,
    parentDisplayName: 'TestUser',
    replyBody: 'hey did you catch that play?',
  },
};

export const JumpToTarget: Story = {
  args: {
    canJumpToReplyTarget: true,
    isReplyingToCurrentUser: false,
    onReplyContextPress: () => {},
    parentDisplayName: 'OriginalUser',
    replyBody: 'tap this row to jump to the original message',
    replyParentMessageId: 'parent-msg-123',
  },
};

export const NoReplyBody: Story = {
  args: {
    canJumpToReplyTarget: false,
    isReplyingToCurrentUser: false,
    parentDisplayName: 'OriginalUser',
  },
};
