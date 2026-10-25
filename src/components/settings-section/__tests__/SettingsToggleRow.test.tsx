import { render } from '@testing-library/react-native';

import { SettingsToggleRow } from '../SettingsSection';

describe('SettingsToggleRow', () => {
  test('reflects the checked state from props', () => {
    const onValueChange = jest.fn();

    const { getByLabelText, rerender } = render(
      <SettingsToggleRow
        title='Show Jump Pill'
        value
        onValueChange={onValueChange}
      />,
    );

    expect(getByLabelText('Show Jump Pill')).toHaveAccessibilityState({
      checked: true,
    });

    rerender(
      <SettingsToggleRow
        title='Show Jump Pill'
        value={false}
        onValueChange={onValueChange}
      />,
    );

    expect(getByLabelText('Show Jump Pill')).toHaveAccessibilityState({
      checked: false,
    });
  });
});
