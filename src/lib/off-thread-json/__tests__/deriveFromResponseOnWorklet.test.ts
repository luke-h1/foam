import { runOnRuntimeAsync } from 'react-native-worklets';

import { deriveFromResponseOnWorklet } from '../deriveFromResponseOnWorklet';

jest.mock('react-native-worklets', () => ({
  createWorkletRuntime: () => ({ name: 'foam-json-parse' }),
  runOnRuntimeAsync: jest.fn(),
}));

const largeBody = JSON.stringify({ value: 'x'.repeat(70 * 1024) });

describe('deriveFromResponseOnWorklet', () => {
  test('derives a small body on the JS thread', async () => {
    await expect(
      deriveFromResponseOnWorklet('{"value":1}', text => JSON.parse(text)),
    ).resolves.toEqual({ value: 1 });

    expect(runOnRuntimeAsync).not.toHaveBeenCalled();
  });

  test('rejects with the derive error and does not derive again on the JS thread', async () => {
    const derive = jest.fn(() => 'parsed');

    jest
      .mocked(runOnRuntimeAsync)
      .mockRejectedValueOnce(new Error('7TV GQL error'));

    await expect(
      deriveFromResponseOnWorklet(largeBody, derive),
    ).rejects.toThrow('7TV GQL error');

    expect(derive).not.toHaveBeenCalled();
  });
});
