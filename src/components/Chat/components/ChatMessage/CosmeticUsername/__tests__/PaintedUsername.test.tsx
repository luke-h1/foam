import { act, render, screen } from '@testing-library/react-native';

import { chatScrollActivity } from '@app/components/Chat/util/chatScrollActivity';
import type { PaintData } from '@app/types/seventv/cosmetics';

import { PaintedUsername } from '../PaintedUsername';

const TWITCH_COLOR = 'rgb(0, 0, 255)';

const GRADIENT_PAINT: PaintData = {
  id: 'paint-1',
  name: 'Gradient',
  color: null,
  layers: {
    0: {
      function: 'LINEAR_GRADIENT',
      stops: {
        0: { at: 0, color: 0xff0000ff },
        1: { at: 0.5, color: 0x00ff00ff },
        length: 2,
      },
      angle: 90,
      shape: 'circle',
      repeat: false,
      image_url: '',
      canvas_repeat: '',
      at: null,
      size: null,
      opacity: 1,
    },
    length: 1,
  },
  shadows: { length: 0 },
  textStyle: null,
  function: 'LINEAR_GRADIENT',
  repeat: false,
  angle: 90,
  shape: 'circle',
  image_url: '',
  stops: { length: 0 },
};

describe('PaintedUsername', () => {
  afterEach(() => {
    act(() => {
      chatScrollActivity.reset();
    });
  });

  test('paints the name through the masked fill at rest', () => {
    render(
      <PaintedUsername
        username='luke'
        paint={GRADIENT_PAINT}
        fallbackColor={TWITCH_COLOR}
        showColon={false}
      />,
    );

    expect(screen.getByTestId('masked-view')).toBeOnTheScreen();
  });

  test('holds a paint colour while the list is flinging', () => {
    render(
      <PaintedUsername
        username='luke'
        paint={GRADIENT_PAINT}
        fallbackColor={TWITCH_COLOR}
        showColon={false}
      />,
    );

    act(() => {
      chatScrollActivity.poke();
    });

    expect(screen.queryByTestId('masked-view')).toBeNull();
    expect(screen.getByText('luke')).toHaveStyle({
      color: 'rgba(0, 255, 0, 1.000)',
    });
  });

  test('falls back to the chat colour for a paint with no colour of its own', () => {
    render(
      <PaintedUsername
        username='luke'
        paint={{
          ...GRADIENT_PAINT,
          layers: {
            0: {
              function: 'URL',
              stops: { length: 0 },
              angle: 0,
              shape: 'circle',
              repeat: false,
              image_url: 'https://cdn.7tv.app/paint/abc/1x.webp',
              canvas_repeat: '',
              at: null,
              size: null,
              opacity: 1,
            },
            length: 1,
          },
        }}
        fallbackColor={TWITCH_COLOR}
        showColon={false}
      />,
    );

    act(() => {
      chatScrollActivity.poke();
    });

    expect(screen.getByText('luke')).toHaveStyle({ color: TWITCH_COLOR });
  });
});
