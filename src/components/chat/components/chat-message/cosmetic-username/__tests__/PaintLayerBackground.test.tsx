import { makeLayer } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/__fixtures__/paintCss.fixture';
import render from '@app/test/render';

import { PaintLayerBackground } from '../PaintLayerBackground';

describe('PaintLayerBackground', () => {
  test('renders a repeating gradient with two equal stops without a duplicate key', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    render(
      <PaintLayerBackground
        layer={makeLayer({
          function: 'LINEAR_GRADIENT',
          repeat: true,
          stops: {
            0: { at: 0.3, color: 0x00_2a_ff_ff },
            1: { at: 0.3, color: 0x00_2a_ff_ff },
            2: { at: 0.8, color: 0xff_00_00_ff },
            length: 3,
          },
        })}
        layerIndex={0}
      />,
    );

    const duplicateKeyErrors = consoleError.mock.calls.filter(call =>
      String(call[0]).includes('same key'),
    );

    consoleError.mockRestore();

    expect(duplicateKeyErrors).toEqual([]);
  });
});
