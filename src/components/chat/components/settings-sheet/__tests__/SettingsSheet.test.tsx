import { type ReactNode, type Ref, useImperativeHandle } from 'react';

import { fireEvent } from '@testing-library/react-native';

import * as BottomSheetModule from '@app/components/bottom-sheet/BottomSheet';
import { getPreferences, preferences$ } from '@app/store/preference-store';
import render from '@app/test/render';

import { SettingsSheet } from '../SettingsSheet';

const mockRequestClose = jest.fn();

interface MockBottomSheetProps {
  children?: ReactNode;
  isPresented: boolean;
  onDismiss?: () => void;
  ref?: Ref<{ requestClose: () => void }>;
}

interface MockableBottomSheet {
  BottomSheet: (props: MockBottomSheetProps) => ReactNode;
}

// SAFETY: spyOn only replaces the BottomSheet property; the suite never calls the original through this shape.
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

    preferences$.set({
      ...getPreferences(),
      chatDensity: 'comfortable',
      chatTimestamps: true,
      highlightOwnMentions: true,
      showInlineReplyContext: true,
      showUnreadJumpPill: true,
    });
  });

  test('appearance toggles write straight to the preference store', () => {
    const { getByLabelText } = render(<SettingsSheet onDismiss={jest.fn()} />);

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

    const { getByText } = render(<SettingsSheet onDismiss={onDismiss} />);

    fireEvent.press(getByText('Density'));

    expect(getPreferences().chatDensity).toBe('compact');

    expect(mockRequestClose).toHaveBeenCalledTimes(1);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
