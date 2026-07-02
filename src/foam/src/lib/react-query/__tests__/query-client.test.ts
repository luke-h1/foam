import { toast } from 'sonner-native';

import { logger } from '@app/utils/logger';

import { handleMutationError, handleQueryError } from '../query-client';

jest.mock('@app/utils/logger', () => ({
  logger: {
    api: { error: jest.fn() },
  },
}));

jest.mock('sonner-native', () => ({
  toast: { error: jest.fn() },
}));

const errorMock = jest.mocked(logger.api.error);
const toastErrorMock = jest.mocked(toast.error);

describe('handleQueryError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('records the error fingerprinted by query scope, not full key', () => {
    const error = new Error('boom');

    handleQueryError(error, ['twitch', 'stream', 'channel-123']);

    expect(errorMock.mock.calls).toEqual([
      [
        'boom',
        {
          name: 'api_error',
          exceptionName: 'Error',
          error,
          queryKey: ['twitch', 'stream', 'channel-123'],
          fingerprint: ['query_error', 'twitch', 'stream'],
        },
      ],
    ]);
  });

  test('does not show a toast for query errors', () => {
    handleQueryError(new Error('boom'), ['twitch']);

    expect(toastErrorMock).not.toHaveBeenCalled();
  });
});

describe('handleMutationError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('records the error and shows the default toast', () => {
    handleMutationError(new Error('boom'), undefined);

    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock.mock.calls).toEqual([
      ['Something went wrong. Try again.'],
    ]);
  });

  test('uses the meta-provided message', () => {
    handleMutationError(new Error('boom'), {
      errorMessage: 'Could not block user',
    });

    expect(toastErrorMock.mock.calls).toEqual([['Could not block user']]);
  });

  test('suppresses the toast when meta opts out', () => {
    handleMutationError(new Error('boom'), { suppressErrorToast: true });

    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).not.toHaveBeenCalled();
  });
});
