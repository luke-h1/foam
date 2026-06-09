import { fireEvent, render } from '@testing-library/react-native';
import type { EmoteMenuSet } from '../emoteMenuData';
import { SetRailButton } from '../SetRailButton';

jest.mock('@app/components/Image/Image', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Image: ({ source }: { source: string }) =>
      React.createElement(Text, { testID: 'set-rail-avatar' }, source),
  };
});

jest.mock('@app/components/Button/Button', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Button: ({
      children,
      onPress,
    }: {
      children: React.ReactNode;
      onPress: () => void;
    }) =>
      React.createElement(
        Text,
        { testID: 'set-rail-button', onPress },
        children,
      ),
  };
});

function createSet(icon: EmoteMenuSet['icon']): EmoteMenuSet {
  return {
    id: 'twitch-sub-owner',
    provider: 'Twitch',
    title: 'Streamer A',
    icon,
    emotes: [],
    shortLabel: 'SA',
  };
}

describe('SetRailButton', () => {
  test('renders avatar image when set icon uses avatar prefix', () => {
    const { getByTestId } = render(
      <SetRailButton
        isActive={false}
        onPress={jest.fn()}
        set={createSet('avatar:https://example.com/pfp.png')}
      />,
    );

    expect(getByTestId('set-rail-avatar')).toHaveTextContent(
      'https://example.com/pfp.png',
    );
  });

  test('renders emoji label for emoji set icons', () => {
    const { getByText } = render(
      <SetRailButton
        isActive={false}
        onPress={jest.fn()}
        set={createSet('emoji:😀')}
      />,
    );

    expect(getByText('😀')).toBeTruthy();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <SetRailButton
        isActive={false}
        onPress={onPress}
        set={createSet('twitch')}
      />,
    );

    fireEvent.press(getByTestId('set-rail-button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
