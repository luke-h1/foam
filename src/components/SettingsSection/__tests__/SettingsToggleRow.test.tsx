import { fireEvent, render } from '@testing-library/react-native';

import { SettingsToggleRow } from '../SettingsSection';

describe('SettingsToggleRow', () => {
  test('passes false when changing the switch from on to off', () => {
    const onValueChange = jest.fn();

    const { getByLabelText } = render(
      <SettingsToggleRow
        title="Show Timestamps"
        value
        onValueChange={onValueChange}
      />,
    );

    const switchControl = getByLabelText('Show Timestamps');

    fireEvent(switchControl, 'valueChange', false);

    expect(onValueChange).toHaveBeenCalledWith(false);
    expect(switchControl).toHaveAccessibilityState({ checked: false });
  });

  test('reflects the checked state from props', () => {
    const onValueChange = jest.fn();

    const { getByLabelText, rerender } = render(
      <SettingsToggleRow
        title="Show Jump Pill"
        value
        onValueChange={onValueChange}
      />,
    );

    expect(getByLabelText('Show Jump Pill')).toHaveAccessibilityState({
      checked: true,
    });

    rerender(
      <SettingsToggleRow
        title="Show Jump Pill"
        value={false}
        onValueChange={onValueChange}
      />,
    );

    expect(getByLabelText('Show Jump Pill')).toHaveAccessibilityState({
      checked: false,
    });
  });
});
