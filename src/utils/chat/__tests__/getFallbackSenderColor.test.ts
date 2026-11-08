import { generateRandomTwitchColor } from '../generateRandomTwitchColor';
import { getFallbackSenderColor } from '../getFallbackSenderColor';

describe('getFallbackSenderColor', () => {
  test('gives one colour for every spelling of a login', () => {
    expect([
      getFallbackSenderColor('Luke_H'),
      getFallbackSenderColor('@luke_h'),
      getFallbackSenderColor(' LUKE_H '),
    ]).toEqual([
      generateRandomTwitchColor('luke_h'),
      generateRandomTwitchColor('luke_h'),
      generateRandomTwitchColor('luke_h'),
    ]);
  });
});
