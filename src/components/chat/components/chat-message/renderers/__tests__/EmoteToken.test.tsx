import { fireEvent, screen } from '@testing-library/react-native';

import render from '@app/test/render';
import type { MessageToken } from '@app/types/chat/messageToken';

import { EmoteToken } from '../EmoteToken';

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
        targetSize={30}
        token={{ ...baseEmote, overlaid: [overlay] }}
        onEmoteTouchStart={onEmoteTouchStart}
      />,
    );

    const [, overlayImage] = screen.getAllByTestId('chat-image-shimmer');

    fireEvent(overlayImage!, 'touchStart');

    expect(onEmoteTouchStart.mock.calls).toEqual([
      [{ ...baseEmote, overlaid: [overlay] }],
    ]);
  });
});
