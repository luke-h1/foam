import { fireEvent, render } from '@testing-library/react-native';
import { ActionSheet } from '../ActionSheet/ActionSheet';
import { UserActionSheet } from '../UserActionSheet';

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('@app/components/Icon/Icon', () => ({
  Icon: () => null,
}));

jest.mock('@app/components/Image/Image', () => ({
  Image: () => null,
}));

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
        message={[{ type: 'text', content: 'hello world' }]}
        username="viewer"
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
    expect(queryByText('Timeout for 10m')).toBeNull();
    expect(queryByText('Ban User')).toBeNull();

    rerender(
      <ActionSheet
        visible
        onClose={onClose}
        message={[{ type: 'text', content: 'hello world' }]}
        username="viewer"
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

    fireEvent.press(getByText('Timeout for 10m'));
    expect(onTimeoutUser).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Ban User'));
    expect(onBanUser).toHaveBeenCalledTimes(1);
  });

  test('hides message delete when there is no message id', () => {
    const { queryByText } = render(
      <ActionSheet
        visible
        onClose={jest.fn()}
        message={[{ type: 'text', content: 'hello world' }]}
        username="viewer"
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
    expect(queryByText('Timeout for 10m')).toBeTruthy();
    expect(queryByText('Ban User')).toBeTruthy();
  });

  test('shows moderator user actions only when the viewer can moderate chat', () => {
    const onTimeoutUser = jest.fn();
    const onBanUser = jest.fn();

    const { rerender, queryByText, getByText } = render(
      <UserActionSheet
        visible
        onClose={jest.fn()}
        username="viewer"
        login="viewer"
        onMentionUser={jest.fn()}
        onCopyUsername={jest.fn()}
        onHideUser={jest.fn()}
        onHighlightUser={jest.fn()}
        onTimeoutUser={onTimeoutUser}
        onBanUser={onBanUser}
        isHidden={false}
        isHighlighted={false}
        canModerateChat={false}
        canModerateUser
      />,
    );

    expect(queryByText('Timeout for 10m')).toBeNull();
    expect(queryByText('Ban User')).toBeNull();

    rerender(
      <UserActionSheet
        visible
        onClose={jest.fn()}
        username="viewer"
        login="viewer"
        onMentionUser={jest.fn()}
        onCopyUsername={jest.fn()}
        onHideUser={jest.fn()}
        onHighlightUser={jest.fn()}
        onTimeoutUser={onTimeoutUser}
        onBanUser={onBanUser}
        isHidden={false}
        isHighlighted={false}
        canModerateChat
        canModerateUser
      />,
    );

    fireEvent.press(getByText('Timeout for 10m'));
    expect(onTimeoutUser).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Ban User'));
    expect(onBanUser).toHaveBeenCalledTimes(1);
  });

  test('hides moderator user actions when the target user cannot be moderated', () => {
    const { queryByText } = render(
      <UserActionSheet
        visible
        onClose={jest.fn()}
        username="viewer"
        login="viewer"
        onMentionUser={jest.fn()}
        onCopyUsername={jest.fn()}
        onHideUser={jest.fn()}
        onHighlightUser={jest.fn()}
        onTimeoutUser={jest.fn()}
        onBanUser={jest.fn()}
        isHidden={false}
        isHighlighted={false}
        canModerateChat
        canModerateUser={false}
      />,
    );

    expect(queryByText('Timeout for 10m')).toBeNull();
    expect(queryByText('Ban User')).toBeNull();
  });
});
