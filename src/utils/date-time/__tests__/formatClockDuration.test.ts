import { formatClockDuration } from '@app/utils/date-time/formatClockDuration';

describe('formatClockDuration', () => {
  test('formats less than an hour as m:ss', () => {
    expect([0, 9, 65, 3599].map(formatClockDuration)).toEqual([
      '0:00',
      '0:09',
      '1:05',
      '59:59',
    ]);
  });

  test('formats an hour or more as h:mm:ss', () => {
    expect([3600, 3725, 90_061].map(formatClockDuration)).toEqual([
      '1:00:00',
      '1:02:05',
      '25:01:01',
    ]);
  });
});
