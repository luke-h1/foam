import { StyleSheet } from 'react-native';

import { screen } from '@testing-library/react-native';

import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import render from '@app/test/render';

import { ChatRowItem } from '../ChatRowItem';

const moderatedMessage = createChatMessageFixture({
  message: [{ type: 'text', content: 'buy followers' }],
  moderationNotice: 'Deleted',
});

describe('ChatRowItem', () => {
  test('passes the moderation notice through, so the row strikes the body', () => {
    render(
      <ChatRowItem
        chatDensity='comfortable'
        channelId='1'
        currentUsernameNormalized=''
        displayFlags={{
          animate: false,
          disableEmoteAnimations: false,
          fontScale: 'default',
          showAlternatingChatRows: false,
          showInlineReplyContext: true,
          showTimestamps: false,
        }}
        getMentionColor={() => '#FFFFFF'}
        highlightedUserSet={new Set()}
        index={0}
        message={moderatedMessage}
        onBadgePress={jest.fn()}
        onMessageLongPress={jest.fn()}
        onReplyContextPress={jest.fn()}
        onUsernamePress={jest.fn()}
        parseTextForEmotes={text => [{ type: 'text', content: text }]}
      />,
    );

    const style = StyleSheet.flatten(
      screen.getByText('buy followers').props['style'],
    );

    expect(style.textDecorationLine).toBe('line-through');
  });
});
