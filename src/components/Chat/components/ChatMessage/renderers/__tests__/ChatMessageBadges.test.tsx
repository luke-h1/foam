import { View } from 'react-native';

import { render } from '@testing-library/react-native';

import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { ChatMessageBadges } from '../ChatMessageBadges';

function renderBadges(badges: SanitisedBadgeSet[]) {
  return render(
    <View>
      <ChatMessageBadges
        badges={badges}
        compact={false}
        getMappingKey={(key, index) => `${key}-${index}`}
      />
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
};

const twitchBadge: SanitisedBadgeSet = {
  id: 'subscriber_12',
  url: 'https://static-cdn.jtvnw.net/badges/v1/8cd10981/3',
  title: '1-Year Subscriber',
  set: 'subscriber',
  type: 'Twitch Subscriber Badge',
};

describe('ChatMessageBadges', () => {
  test('paints an FFZ badge onto its colour', () => {
    const { getByTestId } = renderBadges([ffzModBadge]);

    expect(getByTestId('chat-badge')).toHaveStyle({
      backgroundColor: '#1ac9a2',
    });
  });

  test('leaves a badge without a colour untinted', () => {
    const { getByTestId } = renderBadges([twitchBadge]);

    expect(getByTestId('chat-badge').props.style).toBeUndefined();
  });

  test('renders no slot for a badge without a url', () => {
    const { queryByTestId } = renderBadges([{ ...ffzModBadge, url: '' }]);

    expect(queryByTestId('chat-badge')).toBeNull();
  });
});
