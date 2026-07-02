import { render, screen } from '@testing-library/react-native';

import type { EmoteMenuSet } from '@app/components/Chat/components/EmoteSheet/util/emoteMenuData';

import { SetHeader } from '../SetHeader';

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

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

describe('SetHeader', () => {
  test('renders the streamer avatar for avatar set icons', () => {
    render(
      <SetHeader set={createSet('avatar:https://cdn.example.com/zoil.png')} />,
    );

    expect(screen.getByTestId('emote-set-avatar')).toHaveTextContent(
      'https://cdn.example.com/zoil.png',
    );
    expect(screen.getByText('Zoil')).toBeOnTheScreen();
  });

  test('renders the provider icon for non-avatar set icons', () => {
    render(<SetHeader set={createSet('twitch')} />);

    expect(screen.queryByTestId('emote-set-avatar')).not.toBeOnTheScreen();
    expect(screen.getByText('Zoil')).toBeOnTheScreen();
  });
});
