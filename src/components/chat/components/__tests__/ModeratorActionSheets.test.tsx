import { fireEvent } from '@testing-library/react-native';

import { twitchService } from '@app/services/twitch-service';
import render from '@app/test/render';

import { ActionSheet } from '../action-sheet/ActionSheet';
import { UserActionSheet } from '../UserActionSheet';

// The user card header looks the user up; a real request waits for an auth
// token that this suite never sets.
jest.spyOn(twitchService, 'getUser').mockReturnValue(new Promise(() => {}));

describe('Moderator action sheets', () => {
  test('shows moderator message actions only when the viewer can moderate chat', () => {
    const onDismiss = jest.fn();
    const onDeleteMessage = jest.fn();
    const onTimeoutUser = jest.fn();
    const onBanUser = jest.fn();

    const { rerender, queryByText, getByText } = render(
      <ActionSheet
        onDismiss={onDismiss}
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

    expect(queryByText('Delete message')).toBeNull();

    expect(queryByText('Time out…')).toBeNull();

    expect(queryByText('Ban user')).toBeNull();

    rerender(
      <ActionSheet
        onDismiss={onDismiss}
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

    fireEvent.press(getByText('Delete message'));
    expect(onDeleteMessage).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Time out…'));
    expect(onTimeoutUser).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Ban user'));
    expect(onBanUser).toHaveBeenCalledTimes(1);
  });

  test('hides message delete when there is no message id', () => {
    const { queryByText } = render(
      <ActionSheet
        onDismiss={jest.fn()}
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

    expect(queryByText('Delete message')).toBeNull();

    expect(queryByText('Time out…')).toBeOnTheScreen();

    expect(queryByText('Ban user')).toBeOnTheScreen();
  });

  test('shows pinned message actions for moderators with a message id', () => {
    const onPinMessage = jest.fn();
    const onUpdatePinnedMessage = jest.fn();
    const onUnpinMessage = jest.fn();

    const { rerender, queryByText, getByText } = render(
      <ActionSheet
        onDismiss={jest.fn()}
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

    fireEvent.press(getByText('Pin message'));
    expect(onPinMessage).toHaveBeenCalledTimes(1);

    expect(queryByText('Refresh pin')).toBeNull();

    expect(queryByText('Unpin message')).toBeNull();

    rerender(
      <ActionSheet
        onDismiss={jest.fn()}
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

    fireEvent.press(getByText('Refresh pin'));
    expect(onUpdatePinnedMessage).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Unpin message'));
    expect(onUnpinMessage).toHaveBeenCalledTimes(1);
  });

  test('shows moderator user actions only when the viewer can moderate chat', () => {
    const onTimeoutUser = jest.fn();
    const onBanUser = jest.fn();

    const { rerender, queryByText, getByText } = render(
      <UserActionSheet
        visibility={{
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: false, canModerateUser: true }}
        onDismiss={jest.fn()}
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

    expect(queryByText('Time out…')).toBeNull();

    expect(queryByText('Ban user')).toBeNull();

    rerender(
      <UserActionSheet
        visibility={{
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: true, canModerateUser: true }}
        onDismiss={jest.fn()}
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

    fireEvent.press(getByText('Time out…'));
    expect(onTimeoutUser).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Ban user'));
    expect(onBanUser).toHaveBeenCalledTimes(1);
  });

  test('hides moderator user actions when the target user cannot be moderated', () => {
    const { queryByText } = render(
      <UserActionSheet
        visibility={{
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: true, canModerateUser: false }}
        onDismiss={jest.fn()}
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

    expect(queryByText('Time out…')).toBeNull();

    expect(queryByText('Ban user')).toBeNull();
  });

  test('shows block and report actions only when handlers are provided', () => {
    const onBlockUser = jest.fn();
    const onReportUser = jest.fn();

    const { rerender, queryByText, getByText } = render(
      <UserActionSheet
        visibility={{
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: false, canModerateUser: false }}
        onDismiss={jest.fn()}
        username='viewer'
        login='viewer'
        onMentionUser={jest.fn()}
        onCopyUsername={jest.fn()}
        onHideUser={jest.fn()}
        onHighlightUser={jest.fn()}
      />,
    );

    expect(queryByText('Block user')).toBeNull();

    expect(queryByText('Report user')).toBeNull();

    rerender(
      <UserActionSheet
        visibility={{
          isHidden: false,
          isHighlighted: false,
        }}
        moderation={{ canModerateChat: false, canModerateUser: false }}
        onDismiss={jest.fn()}
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

    fireEvent.press(getByText('Block user'));
    expect(onBlockUser).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Report user'));
    expect(onReportUser).toHaveBeenCalledTimes(1);
  });
});
