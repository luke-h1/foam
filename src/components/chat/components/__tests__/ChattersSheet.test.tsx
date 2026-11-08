import { createElement } from 'react';

import { fireEvent } from '@testing-library/react-native';

import * as InputModule from '@app/components/ui/input/Input';
import { resetMentionLogins } from '@app/store/chat/actions/mention-login-lookup';
import render from '@app/test/render';
import { registerMentionChatter } from '@app/utils/chat/resolve-mention-login/registerMentionChatter';

import {
  ChattersSheet,
  type ChattersSheetProps,
} from '../chatters-sheet/ChattersSheet';

/**
 * The real Input needs a native worklet runtime; render the host 'TextInput'
 * directly - getByPlaceholderText only recognises that literal host type name.
 */
jest
  .spyOn(InputModule, 'Input')
  .mockImplementation(props => createElement('TextInput', props));

function renderChattersSheet(props: ChattersSheetProps) {
  return render(<ChattersSheet {...props} />);
}

describe('ChattersSheet', () => {
  beforeEach(() => {
    resetMentionLogins();
  });

  test('groups chatters by role and selects a chatter on press', () => {
    registerMentionChatter({
      login: 'streamer',
      userId: '1',
      color: '#ff0000',
      role: 'broadcaster',
    });

    registerMentionChatter({
      login: 'a_mod',
      userId: '2',
      color: '#00ff00',
      role: 'moderator',
    });

    registerMentionChatter({
      login: 'SomeViewer',
      userId: '3',
      color: '#0000ff',
    });

    const onSelectChatter = jest.fn();

    const { getByText } = renderChattersSheet({
      onDismiss: jest.fn(),
      onSelectChatter,
    });

    expect(getByText('Broadcaster · 1')).toBeOnTheScreen();

    expect(getByText('Moderators · 1')).toBeOnTheScreen();

    expect(getByText('Viewers · 1')).toBeOnTheScreen();

    fireEvent.press(getByText('SomeViewer'));

    expect(onSelectChatter.mock.calls).toEqual([
      [
        {
          color: '#0000ff',
          login: 'someviewer',
          userId: '3',
          username: 'SomeViewer',
        },
      ],
    ]);
  });

  test('filters chatters by the search query', () => {
    registerMentionChatter({
      login: 'streamer',
      userId: '1',
      color: '#ff0000',
      role: 'broadcaster',
    });

    registerMentionChatter({
      login: 'SomeViewer',
      userId: '3',
      color: '#0000ff',
    });

    const { getByPlaceholderText, queryByText } = renderChattersSheet({
      onDismiss: jest.fn(),
      onSelectChatter: jest.fn(),
    });

    fireEvent.changeText(getByPlaceholderText('Filter chatters'), 'viewer');

    expect(queryByText('SomeViewer')).toBeOnTheScreen();

    expect(queryByText('streamer')).toBeNull();

    expect(queryByText(/^Broadcaster/)).toBeNull();
  });

  test('matches a filter that starts with @ against the login', () => {
    registerMentionChatter({
      login: 'SomeViewer',
      userId: '3',
      color: '#0000ff',
    });

    const { getByPlaceholderText, queryByText } = renderChattersSheet({
      onDismiss: jest.fn(),
      onSelectChatter: jest.fn(),
    });

    fireEvent.changeText(getByPlaceholderText('Filter chatters'), '@some');

    expect(queryByText('SomeViewer')).toBeOnTheScreen();
  });

  test('shows an empty state when no chatters have been seen', () => {
    const { getByText } = renderChattersSheet({
      onDismiss: jest.fn(),
      onSelectChatter: jest.fn(),
    });

    expect(
      getByText(
        'No chatters yet. People appear here once they send a message.',
      ),
    ).toBeOnTheScreen();
  });

  test('gives a mention-only chatter no user id', () => {
    registerMentionChatter({ login: 'MentionOnly' });

    const onSelectChatter = jest.fn();

    const { getByText } = renderChattersSheet({
      onDismiss: jest.fn(),
      onSelectChatter,
    });

    fireEvent.press(getByText('MentionOnly'));

    expect(onSelectChatter).toHaveBeenCalledWith({
      color: '#DAA520',
      login: 'mentiononly',
      userId: undefined,
      username: 'MentionOnly',
    });
  });
});
