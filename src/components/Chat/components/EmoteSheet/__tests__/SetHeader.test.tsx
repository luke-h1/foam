import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import * as ImageModule from '@app/components/Image/Image';
import type { ImageProps } from '@app/components/Image/Image.types';

import { SetHeader } from '../SetHeader';
import { createEmoteMenuSet } from './__fixtures__/emoteMenuSet.fixture';

jest
  .spyOn(ImageModule, 'Image')
  .mockImplementation(({ source }: ImageProps) => (
    <Text testID='emote-set-avatar'>{String(source)}</Text>
  ));

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
