import { StyleSheet } from 'react-native';

import { screen } from '@testing-library/react-native';

import render from '@app/test/render';

import type { ChatTokenRenderProps } from '../types/chat-token-render-props';
import { UserChatBody } from '../UserChatBody';

function renderBody(isModerated: boolean) {
  const tokenRenderProps: ChatTokenRenderProps = {
    density: 'comfortable',
    disableEmoteAnimations: false,
    effectiveHighlightedUserSet: new Set(),
    fontScale: 'default',
    isModerated,
    message: [{ type: 'text', content: 'spam spam spam' }],
  };

  render(
    <UserChatBody
      badgeList={[]}
      replyFlags={{
        canJumpToReplyTarget: false,
        isFirstMessage: false,
        isReplyingToCurrentUser: false,
        shouldRenderInlineReply: false,
        showChannelPointsRewardChrome: false,
        showTimestamp: false,
      }}
      tokenRenderProps={tokenRenderProps}
      username='spammer'
    />,
  );

  return StyleSheet.flatten(screen.getByText('spam spam spam').props['style']);
}

describe('UserChatBody', () => {
  test('strikes and dims the body tokens of a moderated message', () => {
    const style = renderBody(true);

    expect({
      opacity: style.opacity,
      textDecorationLine: style.textDecorationLine,
    }).toEqual({ opacity: 0.72, textDecorationLine: 'line-through' });
  });

  test('leaves the body tokens of a normal message unstruck', () => {
    const style = renderBody(false);

    expect({
      opacity: style.opacity,
      textDecorationLine: style.textDecorationLine,
    }).toEqual({ opacity: undefined, textDecorationLine: undefined });
  });
});
