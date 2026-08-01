import { ActionSheetIOS, Platform } from 'react-native';
import type { ReactNode } from 'react';

import { fireEvent } from '@testing-library/react-native';

import render from '@app/test/render';

import { ActionSheet } from '../ActionSheet/ActionSheet';
import { UserActionSheet } from '../UserActionSheet';

const originalOS = Platform.OS;
beforeAll(() => {
  Platform.OS = 'android';
});
afterAll(() => {
  Platform.OS = originalOS;
});

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
        onReply={jest.fn()}
        onCopy={jest.fn()}
        canModerateChat={false}
        canDeleteMessage
        canModerateUser
        onDeleteMessage={onDeleteMessage}
        onTimeoutUser={onTimeoutUser}
        onBanUser={onBanUser}
      />,
    );

    expect(queryByText('Delete Message')).toBeNull();
    expect(queryByText('Timeout…')).toBeNull();
    expect(queryByText('Ban User')).toBeNull();

    rerender(
      <ActionSheet
        visible
        onClose={onClose}
        username='viewer'
        onReply={jest.fn()}
        onCopy={jest.fn()}
        canModerateChat
        canDeleteMessage
        canModerateUser
        onDeleteMessage={onDeleteMessage}
        onTimeoutUser={onTimeoutUser}
        onBanUser={onBanUser}
      />,
    );

    fireEvent.press(getByText('Delete Message'));
    expect(onDeleteMessage).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Timeout…'));
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
        onReply={jest.fn()}
        onCopy={jest.fn()}
        canModerateChat
        canDeleteMessage={false}
        canModerateUser
        onDeleteMessage={jest.fn()}
        onTimeoutUser={jest.fn()}
        onBanUser={jest.fn()}
      />,
    );

    expect(queryByText('Delete Message')).toBeNull();
    expect(queryByText('Timeout…')).toBeOnTheScreen();
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
        onReply={jest.fn()}
        onCopy={jest.fn()}
        canModerateChat
        canPinMessage
        onPinMessage={onPinMessage}
        onUpdatePinnedMessage={onUpdatePinnedMessage}
        onUnpinMessage={onUnpinMessage}
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
        onReply={jest.fn()}
        onCopy={jest.fn()}
        canModerateChat
        canPinMessage
        isPinnedMessage
        onPinMessage={onPinMessage}
        onUpdatePinnedMessage={onUpdatePinnedMessage}
        onUnpinMessage={onUnpinMessage}
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

    expect(queryByText('Timeout…')).toBeNull();
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

    fireEvent.press(getByText('Timeout…'));
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

    expect(queryByText('Timeout…')).toBeNull();
    expect(queryByText('Ban User')).toBeNull();
  });

  test('shows block and report actions only when handlers are provided', () => {
    const onBlockUser = jest.fn();
    const onReportUser = jest.fn();

    const { rerender, queryByText, getByText } = render(
      <UserActionSheet
        visibility={{
          visible: true,
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: false, canModerateUser: false }}
        onClose={jest.fn()}
        username='viewer'
        login='viewer'
        onMentionUser={jest.fn()}
        onCopyUsername={jest.fn()}
        onHideUser={jest.fn()}
        onHighlightUser={jest.fn()}
      />,
    );

    expect(queryByText('Block User')).toBeNull();
    expect(queryByText('Report User')).toBeNull();

    rerender(
      <UserActionSheet
        visibility={{
          visible: true,
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: false, canModerateUser: false }}
        onClose={jest.fn()}
        username='viewer'
        login='viewer'
        onMentionUser={jest.fn()}
        onCopyUsername={jest.fn()}
        onHideUser={jest.fn()}
        onHighlightUser={jest.fn()}
        onBlockUser={onBlockUser}
        onReportUser={onReportUser}
      />,
    );

    fireEvent.press(getByText('Block User'));
    expect(onBlockUser).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Report User'));
    expect(onReportUser).toHaveBeenCalledTimes(1);
  });
});

describe('iOS native action sheets', () => {
  beforeAll(() => {
    Platform.OS = 'ios';
  });
  afterAll(() => {
    Platform.OS = 'android';
  });

  let showActionSheetSpy: jest.SpyInstance;

  beforeEach(() => {
    showActionSheetSpy = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    showActionSheetSpy.mockRestore();
  });

  test('presents message actions through ActionSheetIOS instead of the JS sheet', () => {
    const onClose = jest.fn();
    const onDeleteMessage = jest.fn();
    const onTimeoutUser = jest.fn();
    const onBanUser = jest.fn();

    const { queryByText } = render(
      <ActionSheet
        visible
        onClose={onClose}
        username='viewer'
        onReply={jest.fn()}
        onCopy={jest.fn()}
        canModerateChat
        canDeleteMessage
        canModerateUser
        onDeleteMessage={onDeleteMessage}
        onTimeoutUser={onTimeoutUser}
        onBanUser={onBanUser}
      />,
    );

    expect(queryByText('Delete Message')).toBeNull();
    expect(showActionSheetSpy).toHaveBeenCalledTimes(1);

    const [options, handler] = showActionSheetSpy.mock.calls[0] as [
      Parameters<typeof ActionSheetIOS.showActionSheetWithOptions>[0],
      (buttonIndex: number) => void,
    ];
    expect({
      title: options.title,
      options: options.options,
      cancelButtonIndex: options.cancelButtonIndex,
      destructiveButtonIndex: options.destructiveButtonIndex,
    }).toEqual({
      title: 'viewer',
      options: [
        'Copy Message',
        'Reply',
        'Hide User',
        'Highlight User',
        'Hide Phrase',
        'Delete Message',
        'Timeout…',
        'Ban User',
        'Cancel',
      ],
      cancelButtonIndex: 8,
      destructiveButtonIndex: [5, 7],
    });

    handler(5);
    expect(onDeleteMessage).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    handler(8);
    expect(onDeleteMessage).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test('does not present again on re-render while visible', () => {
    const { rerender } = render(
      <ActionSheet
        visible
        onClose={jest.fn()}
        username='viewer'
        onReply={jest.fn()}
        onCopy={jest.fn()}
      />,
    );

    rerender(
      <ActionSheet
        visible
        onClose={jest.fn()}
        username='viewer'
        onReply={jest.fn()}
        onCopy={jest.fn()}
      />,
    );

    expect(showActionSheetSpy).toHaveBeenCalledTimes(1);
  });

  test('presents user actions through ActionSheetIOS with destructive ban', () => {
    const onClose = jest.fn();
    const onTimeoutUser = jest.fn();
    const onBanUser = jest.fn();

    const { queryByText } = render(
      <UserActionSheet
        visibility={{
          visible: true,
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: true, canModerateUser: true }}
        onClose={onClose}
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

    expect(queryByText('Ban User')).toBeNull();
    expect(showActionSheetSpy).toHaveBeenCalledTimes(1);

    const [options, handler] = showActionSheetSpy.mock.calls[0] as [
      Parameters<typeof ActionSheetIOS.showActionSheetWithOptions>[0],
      (buttonIndex: number) => void,
    ];
    expect({
      title: options.title,
      options: options.options,
      cancelButtonIndex: options.cancelButtonIndex,
      destructiveButtonIndex: options.destructiveButtonIndex,
    }).toEqual({
      title: 'viewer',
      options: [
        'Mention',
        'Copy Username',
        'Hide User',
        'Highlight User',
        'Warn User',
        'Timeout…',
        'Ban User',
        'Cancel',
      ],
      cancelButtonIndex: 7,
      destructiveButtonIndex: [6],
    });

    handler(5);
    expect(onTimeoutUser).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    handler(6);
    expect(onBanUser).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
