import { ActionSheetIOS, Platform } from 'react-native';

import {
  dismissActionMenu,
  getActionMenuState,
  type ShowActionMenuOptions,
} from '../action-menu-store';
import { showActionMenu } from '../show-action-menu';

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
  dismissActionMenu();
  jest.restoreAllMocks();
});

describe('showActionMenu', () => {
  test('presents an ActionSheetIOS sheet on iOS and forwards the pressed action', () => {
    Platform.OS = 'ios';
    const onPress = jest.fn();

    const sheetSpy = jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_options, callback) => callback(0));

    showActionMenu({
      title: 'Stream',
      actions: [{ label: 'Share', onPress }],
      cancelLabel: 'Cancel',
    });

    expect(sheetSpy.mock.calls[0]![0]).toEqual({
      title: 'Stream',
      options: ['Share', 'Cancel'],
      cancelButtonIndex: 1,
    });

    expect(onPress).toHaveBeenCalledTimes(1);

    expect(getActionMenuState()).toBeNull();
  });

  test('does nothing when cancel is chosen on iOS', () => {
    Platform.OS = 'ios';
    const onPress = jest.fn();

    jest
      .spyOn(ActionSheetIOS, 'showActionSheetWithOptions')
      .mockImplementation((_options, callback) => callback(1));

    showActionMenu({
      title: 'Stream',
      actions: [{ label: 'Share', onPress }],
      cancelLabel: 'Cancel',
    });

    expect(onPress).not.toHaveBeenCalled();
  });

  test('presents all Android actions in a single sheet without paging', () => {
    Platform.OS = 'android';
    const onFirst = jest.fn();
    const onSecond = jest.fn();
    const onThird = jest.fn();

    showActionMenu({
      title: 'Warn user',
      actions: [
        { label: 'Spam', onPress: onFirst },
        { label: 'Harassment', onPress: onSecond },
        { label: 'Other', onPress: onThird },
      ],
      cancelLabel: 'Cancel',
    });

    expect(getActionMenuState()).toEqual<ShowActionMenuOptions>({
      title: 'Warn user',
      actions: [
        { label: 'Spam', onPress: onFirst },
        { label: 'Harassment', onPress: onSecond },
        { label: 'Other', onPress: onThird },
      ],
      cancelLabel: 'Cancel',
    });
  });
});
