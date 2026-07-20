import { ActionSheetIOS, Platform } from 'react-native';

import {
  presentActionMenu,
  type ShowActionMenuOptions,
} from '../actionMenuStore';
import { showActionMenu } from '../showActionMenu';

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
  jest.restoreAllMocks();
});

jest.mock('../actionMenuStore', () => ({
  presentActionMenu: jest.fn(),
}));

const presentActionMenuMock = jest.mocked(presentActionMenu);

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
    expect(presentActionMenuMock).not.toHaveBeenCalled();
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

  test('presents the action menu sheet on Android', () => {
    Platform.OS = 'android';
    const onPress = jest.fn();

    showActionMenu({
      title: 'Stream',
      actions: [{ label: 'Share', onPress }],
      cancelLabel: 'Cancel',
    });

    expect(presentActionMenuMock).toHaveBeenCalledTimes(1);
    expect(
      presentActionMenuMock.mock.calls[0]![0],
    ).toEqual<ShowActionMenuOptions>({
      title: 'Stream',
      actions: [{ label: 'Share', onPress }],
      cancelLabel: 'Cancel',
    });
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

    expect(
      presentActionMenuMock.mock.calls[0]![0],
    ).toEqual<ShowActionMenuOptions>({
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
