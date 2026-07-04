import { render, screen } from '@testing-library/react-native';

import { SetHeader } from '../SetHeader';
import { createEmoteMenuSet } from './__fixtures__/emoteMenuSet.fixture';

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

describe('SetHeader', () => {
  test('renders the streamer avatar for avatar set icons', () => {
    render(
      <SetHeader
        set={createEmoteMenuSet('avatar:https://cdn.example.com/zoil.png')}
      />,
    );

    expect(screen.getByTestId('emote-set-avatar')).toHaveTextContent(
      'https://cdn.example.com/zoil.png',
    );
    expect(screen.getByText('Zoil')).toBeOnTheScreen();
  });

  test('renders the provider icon for non-avatar set icons', () => {
    render(<SetHeader set={createEmoteMenuSet('twitch')} />);

    expect(screen.queryByTestId('emote-set-avatar')).not.toBeOnTheScreen();
    expect(screen.getByText('Zoil')).toBeOnTheScreen();
  });
});
