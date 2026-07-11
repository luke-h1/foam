import { categorizeError, getFriendlyErrorMessage } from '../categorizeError';

describe('categorizeError', () => {
  test('classifies network failures', () => {
    expect(categorizeError(new Error('Network request failed'))).toEqual(
      'network',
    );
    expect(categorizeError(new Error('Request timed out'))).toEqual('network');
    expect(categorizeError(new Error('connect ECONNREFUSED'))).toEqual(
      'network',
    );
  });

  test('classifies everything else as crash', () => {
    expect(categorizeError(new Error('undefined is not a function'))).toEqual(
      'crash',
    );
    expect(categorizeError(null)).toEqual('crash');
  });
});

describe('getFriendlyErrorMessage', () => {
  test('returns the network copy for a network error', () => {
    expect(getFriendlyErrorMessage('network')).toEqual(
      'Foam could not reach Twitch. Check your connection, then try again.',
    );
  });

  test('returns the crash copy for a crash error', () => {
    expect(getFriendlyErrorMessage('crash')).toEqual(
      'Try resetting or restarting the app. If the issue persists, send feedback so we can look into it.',
    );
  });
});
