import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';

import { act, render } from '@testing-library/react-native';
import type { ImageProps } from 'expo-image';
import * as ExpoImage from 'expo-image';

import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { ChatMessageBadges } from '../ChatMessageBadges';

let mockImageProps: ImageProps | null = null;

/**
 * expo-image's `Image` is a forwardRef object, not a plain function, so
 * jest.spyOn cannot wrap it - swap the export directly instead.
 */
Object.defineProperty(ExpoImage, 'Image', {
  configurable: true,
  value: (props: ImageProps) => {
    mockImageProps = props;
    const { View: RNView } = jest.requireActual('react-native');
    return <RNView testID='chat-badge-image' />;
  },
});

function renderBadges(badges: SanitisedBadgeSet[]) {
  return render(
    <View>
      <ChatMessageBadges badges={badges} compact={false} />
    </View>,
  );
}

const ffzModBadge: SanitisedBadgeSet = {
  id: 'mod_badge',
  url: 'https://cdn.frankerfacez.com/room-badge/mod/id/96858382/v/9f5bf0d7/4',
  title: 'Moderator',
  color: '#1ac9a2',
  owner_username: '96858382',
  set: 'mod',
  type: 'FFZ channel badge',
  provider: 'ffz',
};

const twitchBadge: SanitisedBadgeSet = {
  id: 'subscriber_12',
  url: 'https://static-cdn.jtvnw.net/badges/v1/8cd10981/3',
  title: '1-Year Subscriber',
  set: 'subscriber',
  type: 'Twitch Subscriber Badge',
  provider: 'twitch',
};

describe('ChatMessageBadges', () => {
  beforeEach(() => {
    mockImageProps = null;
  });

  test('paints an FFZ badge onto its colour', () => {
    const { getByTestId } = renderBadges([ffzModBadge]);

    expect(
      StyleSheet.flatten(getByTestId('chat-badge').props.style),
    ).toEqual<ViewStyle>({
      backgroundColor: '#1ac9a2',
      borderRadius: 4,
      height: 18,
      marginRight: 4,
      overflow: 'hidden',
      width: 18,
    });
  });

  test('gives an untinted badge a slot that reserves the gap', () => {
    const { getByTestId } = renderBadges([twitchBadge]);

    expect(
      StyleSheet.flatten(getByTestId('chat-badge').props.style),
    ).toEqual<ViewStyle>({
      height: 18,
      marginRight: 4,
      width: 18,
    });
  });

  test('renders the url straight through expo-image, not the emote ref cache', () => {
    renderBadges([twitchBadge]);

    expect(mockImageProps?.source).toEqual(twitchBadge.url);
    expect(mockImageProps?.cachePolicy).toEqual('memory-disk');
  });

  test('renders no slot for a badge without a url', () => {
    const { queryByTestId } = renderBadges([{ ...ffzModBadge, url: '' }]);

    expect(queryByTestId('chat-badge')).toBeNull();
  });

  test('collapses the whole slot when the url is dead, leaving no gap', () => {
    const { getByTestId, queryByTestId } = renderBadges([twitchBadge]);

    expect(getByTestId('chat-badge')).toBeOnTheScreen();

    act(() => {
      mockImageProps?.onError?.({ error: 'dead url' });
    });

    expect(queryByTestId('chat-badge')).toBeNull();
  });
});
