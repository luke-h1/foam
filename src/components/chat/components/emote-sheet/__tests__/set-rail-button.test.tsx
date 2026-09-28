import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import * as ImageModule from '@app/components/image/image';
import type { ImageProps } from '@app/components/image/image.types';

import { SetRailButton } from '../set-rail-button';
import { createEmoteMenuSet } from './__fixtures__/emote-menu-set.fixture';

jest
  .spyOn(ImageModule, 'Image')
  .mockImplementation(({ source }: ImageProps) => (
    <Text testID='emote-set-avatar'>{String(source)}</Text>
  ));

describe('SetRailButton', () => {
  test('renders the streamer avatar for avatar set icons', () => {
    render(
      <SetRailButton
        isActive={false}
        onScrollToSet={jest.fn()}
        set={createEmoteMenuSet('avatar:https://cdn.example.com/zoil.png')}
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
        onScrollToSet={jest.fn()}
        set={createEmoteMenuSet('emoji:😀')}
      />,
    );

    expect(screen.getByText('😀')).toBeOnTheScreen();
    expect(screen.queryByTestId('emote-set-avatar')).not.toBeOnTheScreen();
  });

  test('renders the emote set name for provider icons', () => {
    render(
      <SetRailButton
        isActive={false}
        onScrollToSet={jest.fn()}
        set={createEmoteMenuSet('twitch')}
      />,
    );

    expect(screen.getByText('Zoil')).toBeOnTheScreen();
    expect(screen.queryByTestId('emote-set-avatar')).not.toBeOnTheScreen();
  });
});
