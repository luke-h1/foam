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
  test('returns distinct copy per category', () => {
    expect(getFriendlyErrorMessage('network')).not.toEqual(
      getFriendlyErrorMessage('crash'),
    );
  });
});
