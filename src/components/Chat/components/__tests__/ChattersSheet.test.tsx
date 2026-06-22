import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fireEvent } from '@testing-library/react-native';

import render from '@app/test/render';
import {
  clearMentionLoginIndex,
  registerMentionChatter,
} from '@app/utils/chat/resolveMentionLogin';

import {
  ChattersSheet,
  type ChattersSheetProps,
} from '../ChattersSheet/ChattersSheet';

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('@app/components/ui/Input/Input', () => {
  const React = require('react');
  const { TextInput: MockTextInput } = require('react-native');

  return {
    Input: (props: Record<string, unknown>) =>
      React.createElement(MockTextInput, props),
  };
});

function renderChattersSheet(props: ChattersSheetProps) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { bottom: 0, left: 0, right: 0, top: 0 },
      }}
    >
      <ChattersSheet {...props} />
    </SafeAreaProvider>,
  );
}

describe('ChattersSheet', () => {
  beforeEach(() => {
    clearMentionLoginIndex();
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
      isPresented: true,
      onDismiss: jest.fn(),
      onSelectChatter: onSelectChatter,
    });

    expect(getByText('Broadcaster')).toBeOnTheScreen();
    expect(getByText('Moderators')).toBeOnTheScreen();
    expect(getByText('Viewers')).toBeOnTheScreen();

    fireEvent.press(getByText('SomeViewer'));
    expect(onSelectChatter).toHaveBeenCalledTimes(1);
    expect(onSelectChatter).toHaveBeenCalledWith({
      color: '#0000ff',
      login: 'someviewer',
      userId: '3',
      username: 'SomeViewer',
    });
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
      isPresented: true,
      onDismiss: jest.fn(),
      onSelectChatter: jest.fn(),
    });

    fireEvent.changeText(getByPlaceholderText('Filter chatters'), 'viewer');

    expect(queryByText('SomeViewer')).toBeOnTheScreen();
    expect(queryByText('streamer')).toBeNull();
    expect(queryByText('Broadcaster')).toBeNull();
  });

  test('shows an empty state when no chatters have been seen', () => {
    const { getByText } = renderChattersSheet({
      isPresented: true,
      onDismiss: jest.fn(),
      onSelectChatter: jest.fn(),
    });

    expect(
      getByText(
        'No chatters seen yet. Users appear here once they send a message.',
      ),
    ).toBeOnTheScreen();
  });

  test('omits pseudo user ids from mention-only chatters', () => {
    registerMentionChatter({ login: 'MentionOnly' });

    const onSelectChatter = jest.fn();
    const { getByText } = renderChattersSheet({
      isPresented: true,
      onDismiss: jest.fn(),
      onSelectChatter: onSelectChatter,
    });

    fireEvent.press(getByText('MentionOnly'));
    expect(onSelectChatter).toHaveBeenCalledWith({
      color: expect.any(String),
      login: 'mentiononly',
      userId: undefined,
      username: 'MentionOnly',
    });
  });
});
