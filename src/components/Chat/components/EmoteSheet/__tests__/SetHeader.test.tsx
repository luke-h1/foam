import { render } from '@testing-library/react-native';
import type { EmoteMenuSet } from '../emoteMenuData';
import { SetHeader } from '../SetHeader';

jest.mock('@app/components/Image/Image', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Image: ({ source }: { source: string }) =>
      React.createElement(Text, { testID: 'set-header-avatar' }, source),
  };
});

jest.mock('../EmoteMenuIcon', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    EmoteMenuIcon: () =>
      React.createElement(Text, { testID: 'set-header-icon' }, 'icon'),
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

describe('SetHeader', () => {
  test('renders avatar image when set icon uses avatar prefix', () => {
    const { getByTestId, queryByTestId } = render(
      <SetHeader set={createSet('avatar:https://example.com/pfp.png')} />,
    );

    expect(getByTestId('set-header-avatar')).toHaveTextContent(
      'https://example.com/pfp.png',
    );
    expect(queryByTestId('set-header-icon')).toBeNull();
  });

  test('renders emote menu icon for non-avatar set icons', () => {
    const { getByTestId, queryByTestId } = render(
      <SetHeader set={createSet('twitch')} />,
    );

    expect(getByTestId('set-header-icon')).toBeTruthy();
    expect(queryByTestId('set-header-avatar')).toBeNull();
  });
});
