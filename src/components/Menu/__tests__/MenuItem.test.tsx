import { Text } from '@app/components/Text/Text';
import render from '@app/test/render';
import { type ReactNode } from 'react';
import { MenuItem as MenuItemType } from '../Menu';
import { MenuItem } from '../MenuItem';

jest.mock('@react-native-picker/picker', () => {
  const { Text: NativeText, View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  function MockPicker({
    children,
    selectedValue,
    testID,
  }: {
    children?: ReactNode;
    selectedValue?: string;
    testID?: string;
  }) {
    return (
      <View
        accessibilityValue={{ text: selectedValue }}
        testID={testID ?? 'native-picker'}
      >
        {children}
      </View>
    );
  }

  function MockPickerItem({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) {
    return (
      <NativeText>{`${label}:${value}`}</NativeText>
    );
  }

  return {
    Picker: Object.assign(MockPicker, { Item: MockPickerItem }),
  };
});

describe('MenuItem', () => {
  test('renders an inline native picker and row preview for options items', () => {
    const item = {
      label: 'Chat Density',
      onSelect: jest.fn(),
      options: [
        { label: 'Comfortable', value: 'comfortable' },
        { label: 'Compact', value: 'compact' },
      ],
      preview: <Text>Density preview</Text>,
      type: 'options',
      value: 'comfortable',
    } satisfies MenuItemType;

    const { getByTestId, getByText } = render(<MenuItem item={item} />);

    expect(getByText('Density preview')).toBeOnTheScreen();
    expect(getByTestId('menu-item-picker')).toBeOnTheScreen();
    expect(getByText('Comfortable:comfortable')).toBeOnTheScreen();
    expect(getByText('Compact:compact')).toBeOnTheScreen();
  });
});
