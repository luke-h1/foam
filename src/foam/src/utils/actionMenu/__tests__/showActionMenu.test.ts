import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { showActionMenu } from '../showActionMenu';

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
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

  test('presents an Alert on Android with a trailing cancel button', () => {
    Platform.OS = 'android';
    const onPress = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    showActionMenu({
      title: 'Stream',
      actions: [{ label: 'Share', onPress }],
      cancelLabel: 'Cancel',
    });

    const [title, message, buttons] = alertSpy.mock.calls[0]!;
    expect(title).toBe('Stream');
    expect(message).toBeUndefined();
    expect(buttons).toEqual([
      { text: 'Share', onPress },
      { text: 'Cancel', style: 'cancel' },
    ]);
    buttons![0]!.onPress?.();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
