import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmoteRow } from '../EmoteRow';
import type { EmotePickerItem } from '../emoteSheetTypes';
import { createMenuEmote } from './__fixtures__/emoteMenuData.fixture';

jest.mock('@app/components/Image/Image', () => {
  const { View } = jest.requireActual('react-native');

  return {
    Image: () => <View />,
  };
});

// cellSize + EMOTE_CELL_GAP(4) = 44pt stride, so cell N spans [N*44, N*44 + 40].
const CELL_SIZE = 40;

function renderRow(items: EmotePickerItem[]) {
  const onPress = jest.fn();
  render(<EmoteRow cellSize={CELL_SIZE} items={items} onPress={onPress} />);
  return onPress;
}

describe('EmoteRow', () => {
  const items: EmotePickerItem[] = [
    createMenuEmote('e0', 'first', '7TV Global'),
    createMenuEmote('e1', 'second', '7TV Global'),
    createMenuEmote('e2', 'third', '7TV Global'),
  ];

  test('resolves the tapped emote from the touch x-position', () => {
    const onPress = renderRow(items);

    fireEvent.press(screen.getByLabelText('first'), {
      nativeEvent: { locationX: 50 },
    });

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(items[1]);
  });

  test('maps a tap in the first cell to the first emote', () => {
    const onPress = renderRow(items);

    fireEvent.press(screen.getByLabelText('first'), {
      nativeEvent: { locationX: 10 },
    });

    expect(onPress).toHaveBeenCalledWith(items[0]);
  });

  test('ignores taps past the last emote in a partial row', () => {
    const onPress = renderRow(items);

    fireEvent.press(screen.getByLabelText('first'), {
      nativeEvent: { locationX: 3 * 44 + 10 },
    });

    expect(onPress).not.toHaveBeenCalled();
  });
});
