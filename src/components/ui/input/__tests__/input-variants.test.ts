import type { InputColorConfig } from '@app/styles/ui';

import {
  generateVariantConfig,
  type InputVariant,
} from '../util/input-variants.ios';

describe('generateVariantConfig', () => {
  test('does not append alpha suffixes to transparent', () => {
    expect(generateVariantConfig('transparent', 'dark')).toEqual<
      Record<InputVariant, InputColorConfig>
    >({
      outline: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: 'transparent',
        placeholderColor: 'transparent',
        borderWidth: 1,
      },
      soft: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: 'transparent',
        placeholderColor: 'transparent',
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: 'transparent',
        placeholderColor: 'transparent',
        borderWidth: 1,
      },
      underline: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: 'transparent',
        placeholderColor: 'transparent',
        borderWidth: 1,
      },
    });
  });
});
