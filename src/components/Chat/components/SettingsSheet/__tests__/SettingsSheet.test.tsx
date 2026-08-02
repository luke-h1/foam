import { fireEvent } from '@testing-library/react-native';

import { getPreferences, replacePreferences } from '@app/store/preferenceStore';
import render from '@app/test/render';

import { SettingsSheet } from '../SettingsSheet';

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

const mockRequestClose = jest.fn();

jest.mock('@app/components/BottomSheet/BottomSheet', () => {
  const React = require('react');

  return {
    BottomSheet: React.forwardRef(function MockBottomSheet(
      {
        children,
        isPresented,
        onDismiss,
      }: {
        children?: React.ReactNode;
        isPresented: boolean;
        onDismiss?: () => void;
      },
      ref: React.Ref<{ requestClose: () => void }>,
    ) {
      React.useImperativeHandle(ref, () => ({
        requestClose: () => {
          mockRequestClose();
          onDismiss?.();
        },
      }));

      return isPresented ? children : null;
    }),
  };
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
});
