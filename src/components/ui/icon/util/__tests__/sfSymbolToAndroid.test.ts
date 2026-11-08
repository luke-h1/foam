import { logger } from '@app/utils/logger';

import { sfSymbolToAndroid } from '../sfSymbolToAndroid';

describe('sfSymbolToAndroid', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    ['person.crop.circle', 'account_circle'],
    ['wifi.slash', 'wifi_off'],
    ['sparkles', 'auto_awesome'],
    ['flame.fill', 'local_fire_department'],
    ['shield.fill', 'shield'],
    ['arrow.uturn.backward', 'undo'],
  ])('maps %s to %s', (sfSymbol, androidSymbol) => {
    expect(sfSymbolToAndroid(sfSymbol)).toBe(androidSymbol);
  });

  test('warns in development and draws a circle for an unmapped name', () => {
    const warn = jest.spyOn(logger.main, 'warn').mockImplementation(() => {});

    expect(sfSymbolToAndroid('not.a.symbol')).toBe('circle');

    expect(warn.mock.calls).toEqual([
      ['[sfSymbolToAndroid] no Material symbol for SF Symbol "not.a.symbol"'],
    ]);
  });
});
