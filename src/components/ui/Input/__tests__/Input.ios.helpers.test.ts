import { buildTextFieldModifiers } from '../Input.ios.helpers';

describe('Input iOS helpers', () => {
  test('does not frame multiline text fields inside their padded container', () => {
    const modifiers = buildTextFieldModifiers({
      disabled: false,
      multiline: true,
      style: {
        maxHeight: 120,
        minHeight: 48,
        paddingBottom: 12,
        paddingTop: 12,
      },
      textColor: '#ffffff',
      tintColor: '#ffffff',
    });

    expect(modifiers.map(modifier => modifier.$type)).toEqual([
      'textFieldStyle',
      'foregroundStyle',
      'tint',
      'padding',
      'lineLimit',
    ]);
    expect(modifiers.find(modifier => modifier.$type === 'lineLimit')).toEqual({
      $type: 'lineLimit',
      limit: 5,
    });
  });
});
