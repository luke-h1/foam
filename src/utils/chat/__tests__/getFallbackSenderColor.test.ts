import { getFallbackSenderColor } from '../getFallbackSenderColor';

describe('getFallbackSenderColor', () => {
  test('gives one colour for every spelling of a login', () => {
    expect([
      getFallbackSenderColor('Luke_H'),
      getFallbackSenderColor('@luke_h'),
      getFallbackSenderColor(' LUKE_H '),
    ]).toEqual(['#5F9EA0', '#5F9EA0', '#5F9EA0']);
  });
});
