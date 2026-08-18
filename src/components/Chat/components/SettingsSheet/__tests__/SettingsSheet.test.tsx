import { type ReactNode, type Ref, useImperativeHandle } from 'react';
import { Platform } from 'react-native';

import { fireEvent } from '@testing-library/react-native';

import * as BottomSheetModule from '@app/components/BottomSheet/BottomSheet';
import { getPreferences, replacePreferences } from '@app/store/preferenceStore';
import render from '@app/test/render';

import { SettingsSheet } from '../SettingsSheet';

const originalOS = Platform.OS;
beforeAll(() => {
  Platform.OS = 'android';
});
afterAll(() => {
  Platform.OS = originalOS;
});

const mockRequestClose = jest.fn();

/**
 * The real BottomSheet is `memo(...)`-wrapped, which types as an exotic
 * component object rather than a plain function, so the bridge below narrows
 * through `never` to reach a spyable function property.
 */
type MockableBottomSheet = {
  BottomSheet: (props: {
    children?: ReactNode;
    isPresented: boolean;
    onDismiss?: () => void;
    ref?: Ref<{ requestClose: () => void }>;
  }) => ReactNode;
};
// SAFETY: the real BottomSheet is the memo-wrapped exotic component
// described above; `never` is the only type TS accepts as a bridge to the
// plain function shape MockableBottomSheet.
const mockableBottomSheet: MockableBottomSheet = BottomSheetModule as never;

jest
  .spyOn(mockableBottomSheet, 'BottomSheet')
  .mockImplementation(({ children, isPresented, onDismiss, ref }) => {
    useImperativeHandle(ref, () => ({
      requestClose: () => {
        mockRequestClose();
        onDismiss?.();
      },
    }));

    return isPresented ? children : null;
  });

describe('SettingsSheet', () => {
  beforeEach(() => {
    mockRequestClose.mockClear();
    replacePreferences({
      ...getPreferences(),
      chatDensity: 'comfortable',
      chatTimestamps: true,
      highlightOwnMentions: true,
      showInlineReplyContext: true,
      showUnreadJumpPill: true,
    });
  });

  test('appearance toggles write straight to the preference store', () => {
    const { getByLabelText } = render(
      <SettingsSheet isPresented onDismiss={jest.fn()} />,
    );

    fireEvent(getByLabelText('Show Timestamps'), 'valueChange', false);
    fireEvent(getByLabelText('Highlight Own Mentions'), 'valueChange', false);
    fireEvent(getByLabelText('Inline Reply Context'), 'valueChange', false);
    fireEvent(getByLabelText('Show Jump Pill'), 'valueChange', false);

    const preferences = getPreferences();
    expect({
      chatTimestamps: preferences.chatTimestamps,
      highlightOwnMentions: preferences.highlightOwnMentions,
      showInlineReplyContext: preferences.showInlineReplyContext,
      showUnreadJumpPill: preferences.showUnreadJumpPill,
    }).toEqual({
      chatTimestamps: false,
      highlightOwnMentions: false,
      showInlineReplyContext: false,
      showUnreadJumpPill: false,
    });
  });

  test('density row flips the density preference and dismisses the sheet', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <SettingsSheet isPresented onDismiss={onDismiss} />,
    );

    fireEvent.press(getByText('Density'));

    expect(getPreferences().chatDensity).toBe('compact');
    expect(mockRequestClose).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  describe('on iOS', () => {
    beforeAll(() => {
      Platform.OS = 'ios';
    });
    afterAll(() => {
      Platform.OS = 'android';
    });

    test('renders the same JS rows as Android', () => {
      const { getByText } = render(
        <SettingsSheet isPresented onDismiss={jest.fn()} />,
      );

      fireEvent.press(getByText('Density'));

      expect(getPreferences().chatDensity).toBe('compact');
    });
  });
});
