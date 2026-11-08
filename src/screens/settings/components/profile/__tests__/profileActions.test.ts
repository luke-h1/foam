import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { logger } from '@app/utils/logger';

import { signOut } from '../util/profileActions';

describe('signOut', () => {
  beforeEach(() => {
    jest.mocked(router.replace).mockClear();
    jest.mocked(toast.error).mockClear();
  });

  test('leaves the profile as soon as logout resolves, with no timer', async () => {
    jest.useFakeTimers();

    await signOut(() => Promise.resolve());

    expect(jest.mocked(router.replace).mock.calls).toEqual([['/tabs/top']]);

    expect(jest.getTimerCount()).toBe(0);

    jest.useRealTimers();
  });

  test('stays on the profile and shows a toast when logout fails', async () => {
    const warnSpy = jest
      .spyOn(logger.main, 'warn')
      .mockImplementation(() => {});

    await signOut(() => Promise.reject(new Error('revoke failed')));

    expect(router.replace).not.toHaveBeenCalled();

    expect(jest.mocked(toast.error).mock.calls).toEqual([
      ['Could not sign out. Try again.'],
    ]);

    warnSpy.mockRestore();
  });
});
