import {
  categorizeError,
  getErrorTitle,
  getFriendlyErrorMessage,
} from '../categorize-error';

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

  test('classifies an HTTP 403 as blocked', () => {
    expect(
      categorizeError(
        new Error('Auth proxy token request failed: HTTP 403 (text/html)'),
      ),
    ).toEqual('blocked');
  });

  test('classifies a JSON parse failure as a bad response', () => {
    expect(
      categorizeError(
        new SyntaxError('JSON Parse error: Unexpected character: <'),
      ),
    ).toEqual('bad-response');
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
      'Reset or restart the app. If the problem continues, send feedback.',
    );
  });
});

describe('getErrorTitle', () => {
  test.each([
    ['network', 'Connection trouble'],
    ['blocked', 'Access blocked'],
    ['bad-response', 'Unexpected response'],
    ['crash', 'Something went wrong'],
  ] as const)('returns the title for %s', (category, title) => {
    expect(getErrorTitle(category)).toEqual(title);
  });
});
