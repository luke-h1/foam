import { ActionSheetIOS, Platform } from 'react-native';

import { fireEvent, screen } from '@testing-library/react-native';

import type { ComposerOverflowAction } from '@app/components/chat/components/chat-composer/util/composerOverflowActions';
import {
  dismissActionMenu,
  getActionMenuState,
  type ShowActionMenuOptions,
} from '@app/store/overlays/action-menu-store';
import render from '@app/test/render';

const { ComposerOverflowButton } = jest.requireActual<
  typeof import('../ComposerOverflowButton')
>('../ComposerOverflowButton.tsx');

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
  dismissActionMenu();
  jest.restoreAllMocks();
});

function createActions(): ComposerOverflowAction[] {
  return [
    { icon: 'camera', label: 'Clip', onPress: jest.fn() },
    { disabled: true, icon: 'gift', label: 'Gift', onPress: jest.fn() },
    { icon: 'flag', label: 'Report', onPress: jest.fn() },
  ];
}

describe('ComposerOverflowButton', () => {
  test('presents the enabled actions in the in-app menu on Android', () => {
    Platform.OS = 'android';
    const actions = createActions();

    render(<ComposerOverflowButton actions={actions} />);

    fireEvent.press(screen.getByLabelText('More options'));

    expect(getActionMenuState()).toEqual<ShowActionMenuOptions>({
      title: 'Message',
      actions: [
        { label: 'Clip', onPress: actions[0]!.onPress },
        { label: 'Report', onPress: actions[2]!.onPress },
      ],
    });
  });

  test('presents an ActionSheetIOS sheet on iOS', () => {
    Platform.OS = 'ios';

    const sheetSpy = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_options, callback) => callback(1));

    const actions = createActions();

    render(<ComposerOverflowButton actions={actions} />);

    fireEvent.press(screen.getByLabelText('More options'));

    expect(sheetSpy.mock.calls[0]![0]).toEqual({
      title: 'Message',
      options: ['Clip', 'Report', 'Cancel'],
      cancelButtonIndex: 2,
    });

    expect(actions[2]!.onPress).toHaveBeenCalledTimes(1);

    expect(getActionMenuState()).toBeNull();
  });
});
