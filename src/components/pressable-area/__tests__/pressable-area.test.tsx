import { Profiler } from 'react';

import { fireEvent, render } from '@testing-library/react-native';

import { Text } from '@app/components/ui/text/text';

import { PressableArea } from '../pressable-area';

describe('PressableArea', () => {
  test.each(['dim', 'highlight'] as const)(
    'does not re-render on press in and press out with %s feedback',
    feedback => {
      const onRender = jest.fn();
      const onPress = jest.fn();
      const onPressIn = jest.fn();
      const onPressOut = jest.fn();

      const { getByLabelText } = render(
        <Profiler id='pressable-area' onRender={onRender}>
          <PressableArea
            accessibilityLabel='Open stream'
            feedback={feedback}
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
          >
            <Text>Stream</Text>
          </PressableArea>
        </Profiler>,
      );

      onRender.mockClear();

      const pressable = getByLabelText('Open stream');

      fireEvent(pressable, 'pressIn');
      fireEvent.press(pressable);
      fireEvent(pressable, 'pressOut');

      expect(onRender).not.toHaveBeenCalled();
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPressIn).toHaveBeenCalledTimes(1);
      expect(onPressOut).toHaveBeenCalledTimes(1);
    },
  );
});
