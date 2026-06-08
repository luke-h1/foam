import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ActionSheet } from '../ActionSheet/ActionSheet';
import { UserActionSheet } from '../UserActionSheet';

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('@app/components/Image/Image', () => ({
  Image: () => null,
}));

jest.mock('react-native-teleport', () => {
  const React = require('react');
  const { View } = require('react-native');
  type mockPortalProps = { children?: ReactNode };

  return {
    Portal: ({ children }: mockPortalProps) => children,
    PortalHost: ({ children }: mockPortalProps) =>
      React.createElement(View, null, children),
    PortalProvider: ({ children }: mockPortalProps) => children,
  };
});

describe('Moderator action sheets', () => {
  test('shows moderator message actions only when the viewer can moderate chat', () => {
    const onClose = jest.fn();
    const onDeleteMessage = jest.fn();
    const onTimeoutUser = jest.fn();
    const onBanUser = jest.fn();

    const { rerender, queryByText, getByText } = render(
      <ActionSheet
        visible
        onClose={onClose}
        username='viewer'
        handleReply={jest.fn()}
        handleCopy={jest.fn()}
        canModerateChat={false}
        canDeleteMessage
        canModerateUser
        handleDeleteMessage={onDeleteMessage}
        handleTimeoutUser={onTimeoutUser}
        handleBanUser={onBanUser}
      />,
    );

    expect(queryByText('Delete Message')).toBeNull();
    expect(queryByText('Timeout User')).toBeNull();
    expect(queryByText('Ban User')).toBeNull();

    rerender(
      <ActionSheet
        visible
        onClose={onClose}
        username='viewer'
        handleReply={jest.fn()}
        handleCopy={jest.fn()}
        canModerateChat
        canDeleteMessage
        canModerateUser
        handleDeleteMessage={onDeleteMessage}
        handleTimeoutUser={onTimeoutUser}
        handleBanUser={onBanUser}
      />,
    );

    fireEvent.press(getByText('Delete Message'));
    expect(onDeleteMessage).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Timeout User'));
    expect(onTimeoutUser).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Ban User'));
    expect(onBanUser).toHaveBeenCalledTimes(1);
  });

  test('hides message delete when there is no message id', () => {
    const { queryByText } = render(
      <ActionSheet
        visible
        onClose={jest.fn()}
        username='viewer'
        handleReply={jest.fn()}
        handleCopy={jest.fn()}
        canModerateChat
        canDeleteMessage={false}
        canModerateUser
        handleDeleteMessage={jest.fn()}
        handleTimeoutUser={jest.fn()}
        handleBanUser={jest.fn()}
      />,
    );

    expect(queryByText('Delete Message')).toBeNull();
    expect(queryByText('Timeout User')).toBeOnTheScreen();
    expect(queryByText('Ban User')).toBeOnTheScreen();
  });

  test('shows pinned message actions for moderators with a message id', () => {
    const onPinMessage = jest.fn();
    const onUpdatePinnedMessage = jest.fn();
    const onUnpinMessage = jest.fn();

    const { rerender, queryByText, getByText } = render(
      <ActionSheet
        visible
        onClose={jest.fn()}
        username='viewer'
        handleReply={jest.fn()}
        handleCopy={jest.fn()}
        canModerateChat
        canPinMessage
        handlePinMessage={onPinMessage}
        handleUpdatePinnedMessage={onUpdatePinnedMessage}
        handleUnpinMessage={onUnpinMessage}
      />,
    );

    fireEvent.press(getByText('Pin Message'));
    expect(onPinMessage).toHaveBeenCalledTimes(1);
    expect(queryByText('Refresh Pin')).toBeNull();
    expect(queryByText('Unpin Message')).toBeNull();

    rerender(
      <ActionSheet
        visible
        onClose={jest.fn()}
        username='viewer'
        handleReply={jest.fn()}
        handleCopy={jest.fn()}
        canModerateChat
        canPinMessage
        isPinnedMessage
        handlePinMessage={onPinMessage}
        handleUpdatePinnedMessage={onUpdatePinnedMessage}
        handleUnpinMessage={onUnpinMessage}
      />,
    );

    fireEvent.press(getByText('Refresh Pin'));
    expect(onUpdatePinnedMessage).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Unpin Message'));
    expect(onUnpinMessage).toHaveBeenCalledTimes(1);
  });

  test('shows moderator user actions only when the viewer can moderate chat', () => {
    const onTimeoutUser = jest.fn();
    const onBanUser = jest.fn();

    const { rerender, queryByText, getByText } = render(
      <UserActionSheet
        visibility={{
          visible: true,
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: false, canModerateUser: true }}
        onClose={jest.fn()}
        username='viewer'
        login='viewer'
        onMentionUser={jest.fn()}
        onCopyUsername={jest.fn()}
        onHideUser={jest.fn()}
        onHighlightUser={jest.fn()}
        onTimeoutUser={onTimeoutUser}
        onBanUser={onBanUser}
      />,
    );

    expect(queryByText('Timeout User')).toBeNull();
    expect(queryByText('Ban User')).toBeNull();

    rerender(
      <UserActionSheet
        visibility={{
          visible: true,
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: true, canModerateUser: true }}
        onClose={jest.fn()}
        username='viewer'
        login='viewer'
        onMentionUser={jest.fn()}
        onCopyUsername={jest.fn()}
        onHideUser={jest.fn()}
        onHighlightUser={jest.fn()}
        onTimeoutUser={onTimeoutUser}
        onBanUser={onBanUser}
      />,
    );

    fireEvent.press(getByText('Timeout User'));
    expect(onTimeoutUser).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Ban User'));
    expect(onBanUser).toHaveBeenCalledTimes(1);
  });

  test('hides moderator user actions when the target user cannot be moderated', () => {
    const { queryByText } = render(
      <UserActionSheet
        visibility={{
          visible: true,
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: true, canModerateUser: false }}
        onClose={jest.fn()}
        username='viewer'
        login='viewer'
        onMentionUser={jest.fn()}
        onCopyUsername={jest.fn()}
        onHideUser={jest.fn()}
        onHighlightUser={jest.fn()}
        onTimeoutUser={jest.fn()}
        onBanUser={jest.fn()}
      />,
    );

    expect(queryByText('Timeout User')).toBeNull();
    expect(queryByText('Ban User')).toBeNull();
  });
});
