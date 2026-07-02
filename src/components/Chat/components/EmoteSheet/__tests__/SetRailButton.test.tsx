import { render, screen } from '@testing-library/react-native';

import type { EmoteMenuSet } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';

import { SetRailButton } from '../SetRailButton';

jest.mock('@app/components/Image/Image', () => {
  const { Text } = jest.requireActual('react-native');

  return {
    Image: ({ source }: { source: string }) => (
      <Text testID='emote-set-avatar'>{source}</Text>
    ),
  };
});

function createSet(icon: EmoteMenuSet['icon']): EmoteMenuSet {
  return {
    id: 'twitch-sub-100',
    provider: 'Twitch',
    title: 'Zoil',
    icon,
    emotes: [],
    shortLabel: 'ZO',
  };
}

describe('SetRailButton', () => {
  test('renders the streamer avatar for avatar set icons', () => {
    render(
      <SetRailButton
        isActive={false}
        onPress={jest.fn()}
        set={createSet('avatar:https://cdn.example.com/zoil.png')}
      />,
    );

    expect(screen.getByTestId('emote-set-avatar')).toHaveTextContent(
      'https://cdn.example.com/zoil.png',
    );
  });

  test('renders the emoji for emoji set icons', () => {
    render(
      <SetRailButton
        isActive={false}
        onPress={jest.fn()}
        set={createSet('emoji:😀')}
      />,
    );

    expect(screen.getByText('😀')).toBeOnTheScreen();
    expect(screen.queryByTestId('emote-set-avatar')).not.toBeOnTheScreen();
  });

  test('renders the short label for provider set icons', () => {
    render(
      <SetRailButton
        isActive={false}
        onPress={jest.fn()}
        set={createSet('twitch')}
      />,
    );

    expect(screen.getByText('ZO')).toBeOnTheScreen();
    expect(screen.queryByTestId('emote-set-avatar')).not.toBeOnTheScreen();
  });
});
