import { fireEvent, screen } from '@testing-library/react-native';

import render from '@app/test/render';
import type { MessageToken } from '@app/utils/chat/message-token';

import { EmoteToken } from '../emote-token';

const baseEmote: MessageToken<'emote'> = {
  type: 'emote',
  content: 'KEKW',
  name: 'KEKW',
  id: 'base',
  url: 'https://cdn.7tv.app/emote/base/2x.webp',
  width: 28,
  height: 28,
  site: '7TV Channel',
};

const overlay = {
  ...baseEmote,
  content: 'RainTime',
  name: 'RainTime',
  id: 'overlay',
  url: 'https://cdn.7tv.app/emote/overlay/2x.webp',
};

describe('EmoteToken', () => {
  test('records the base emote when a touch lands on an overlay stack', () => {
    const onEmoteTouchStart = jest.fn();

    render(
      <EmoteToken
        token={{ ...baseEmote, overlaid: [overlay] }}
        onEmoteTouchStart={onEmoteTouchStart}
      />,
    );

    const touchTargets = screen.UNSAFE_root.findAll(
      node => String(node.type) === 'View' && Boolean(node.props.onTouchStart),
    );

    expect(touchTargets).toHaveLength(1);

    fireEvent(touchTargets[0]!, 'touchStart');

    expect(onEmoteTouchStart.mock.calls).toEqual([
      [{ ...baseEmote, overlaid: [overlay] }],
    ]);
  });
});
