import type { InputColorConfig } from '@app/styles/ui';

import {
  generateVariantConfig,
  generateVariantConfigFromBase,
  type InputVariant,
} from '../inputVariants.ios';

describe('generateVariantConfig', () => {
  test('returns palette configs for purple in dark mode', () => {
    expect(generateVariantConfig('purple', 'dark')).toEqual<
      Record<InputVariant, InputColorConfig>
    >({
      outline: {
        backgroundColor: 'transparent',
        borderColor: '#a855f7',
        textColor: '#a855f7',
        placeholderColor: '#6b21a8',
        borderWidth: 1,
      },
      soft: {
        backgroundColor: '#a855f720',
        borderColor: 'transparent',
        textColor: '#a855f7',
        placeholderColor: '#6b21a8',
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: '#a855f720',
        borderColor: '#a855f7',
        textColor: '#a855f7',
        placeholderColor: '#6b21a8',
        borderWidth: 1,
      },
      underline: {
        backgroundColor: 'transparent',
        borderColor: '#a855f7',
        textColor: '#a855f7',
        placeholderColor: '#6b21a8',
        borderWidth: 1,
      },
    });
  });

  test('returns palette configs for purple in light mode', () => {
    expect(generateVariantConfig('purple', 'light')).toEqual<
      Record<InputVariant, InputColorConfig>
    >({
      outline: {
        backgroundColor: 'transparent',
        borderColor: '#9333ea',
        textColor: '#9333ea',
        placeholderColor: '#d8b4fe',
        borderWidth: 1,
      },
      soft: {
        backgroundColor: '#9333ea10',
        borderColor: 'transparent',
        textColor: '#9333ea',
        placeholderColor: '#d8b4fe',
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: '#9333ea10',
        borderColor: '#9333ea',
        textColor: '#9333ea',
        placeholderColor: '#d8b4fe',
        borderWidth: 1,
      },
      underline: {
        backgroundColor: 'transparent',
        borderColor: '#9333ea',
        textColor: '#9333ea',
        placeholderColor: '#d8b4fe',
        borderWidth: 1,
      },
    });
  });

  test('returns grayscale configs for black in light mode', () => {
    expect(generateVariantConfig('black', 'light')).toEqual<
      Record<InputVariant, InputColorConfig>
    >({
      outline: {
        backgroundColor: 'transparent',
        borderColor: '#000000',
        textColor: '#000000',
        placeholderColor: '#4D4D4D',
        borderWidth: 1,
      },
      soft: {
        backgroundColor: '#00000010',
        borderColor: 'transparent',
        textColor: '#000000',
        placeholderColor: '#4D4D4D',
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: '#00000010',
        borderColor: '#000000',
        textColor: '#000000',
        placeholderColor: '#4D4D4D',
        borderWidth: 1,
      },
      underline: {
        backgroundColor: 'transparent',
        borderColor: '#000000',
        textColor: '#000000',
        placeholderColor: '#4D4D4D',
        borderWidth: 1,
      },
    });
  });

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

  test('returns grayscale configs for white in dark mode', () => {
    expect(generateVariantConfig('white', 'dark')).toEqual<
      Record<InputVariant, InputColorConfig>
    >({
      outline: {
        backgroundColor: 'transparent',
        borderColor: '#FFFFFF',
        textColor: '#FFFFFF',
        placeholderColor: '#CCCCCC',
        borderWidth: 1,
      },
      soft: {
        backgroundColor: '#FFFFFF20',
        borderColor: 'transparent',
        textColor: '#FFFFFF',
        placeholderColor: '#CCCCCC',
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: '#FFFFFF20',
        borderColor: '#FFFFFF',
        textColor: '#FFFFFF',
        placeholderColor: '#CCCCCC',
        borderWidth: 1,
      },
      underline: {
        backgroundColor: 'transparent',
        borderColor: '#FFFFFF',
        textColor: '#FFFFFF',
        placeholderColor: '#CCCCCC',
        borderWidth: 1,
      },
    });
  });
});

describe('generateVariantConfigFromBase', () => {
  test('returns accent-derived configs in dark mode', () => {
    expect(generateVariantConfigFromBase('#8f43ee', 'dark')).toEqual<
      Record<InputVariant, InputColorConfig>
    >({
      outline: {
        backgroundColor: 'transparent',
        borderColor: '#8f43ee',
        textColor: '#8f43ee',
        placeholderColor: '#8f43ee99',
        borderWidth: 1,
      },
      soft: {
        backgroundColor: '#8f43ee20',
        borderColor: 'transparent',
        textColor: '#8f43ee',
        placeholderColor: '#8f43ee99',
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: '#8f43ee20',
        borderColor: '#8f43ee',
        textColor: '#8f43ee',
        placeholderColor: '#8f43ee99',
        borderWidth: 1,
      },
      underline: {
        backgroundColor: 'transparent',
        borderColor: '#8f43ee',
        textColor: '#8f43ee',
        placeholderColor: '#8f43ee99',
        borderWidth: 1,
      },
    });
  });

  test('returns accent-derived configs in light mode', () => {
    expect(generateVariantConfigFromBase('#8f43ee', 'light')).toEqual<
      Record<InputVariant, InputColorConfig>
    >({
      outline: {
        backgroundColor: 'transparent',
        borderColor: '#8f43ee',
        textColor: '#8f43ee',
        placeholderColor: '#8f43ee66',
        borderWidth: 1,
      },
      soft: {
        backgroundColor: '#8f43ee10',
        borderColor: 'transparent',
        textColor: '#8f43ee',
        placeholderColor: '#8f43ee66',
        borderWidth: 0,
      },
      subtle: {
        backgroundColor: '#8f43ee10',
        borderColor: '#8f43ee',
        textColor: '#8f43ee',
        placeholderColor: '#8f43ee66',
        borderWidth: 1,
      },
      underline: {
        backgroundColor: 'transparent',
        borderColor: '#8f43ee',
        textColor: '#8f43ee',
        placeholderColor: '#8f43ee66',
        borderWidth: 1,
      },
    });
  });
});
