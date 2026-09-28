import { makePaint } from '../__fixtures__/paint-css.fixture';
import { buildPaintCssDeclarations } from '../build-paint-css-declarations';
import { paintCssDeclarationsToBlock } from '../paint-css-declarations-to-block';

describe('paintCssDeclarationsToBlock', () => {
  test('emits one declaration per line in the extension rule order', () => {
    const block = paintCssDeclarationsToBlock(
      buildPaintCssDeclarations(makePaint({})),
    );

    expect(block).toEqual(
      [
        'color: inherit;',
        'background-image: none;',
        'background-position: 0% 0%;',
        'background-size: auto;',
        'background-repeat: unset;',
        'filter: inherit;',
        'font-weight: inherit;',
        '-webkit-text-stroke-width: inherit;',
        '-webkit-text-stroke-color: inherit;',
        'text-shadow: unset;',
        'text-transform: unset;',
      ].join('\n'),
    );
  });
});
