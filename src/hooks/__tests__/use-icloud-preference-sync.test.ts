import { act, renderHook } from '@testing-library/react-native';

import {
  isICloudPreferenceSyncAvailable,
  loadPreferencesFromICloud,
  savePreferencesToICloud,
  synchronizeICloudPreferences,
} from '@app/lib/icloudSync';
import {
  getPreferences,
  initialPreferences,
  type Preferences,
  replacePreferences,
  updatePreferences,
} from '@app/store/preference-store';

import { useIcloudPreferenceSync } from '../use-icloud-preference-sync';

jest.mock('@app/lib/icloudSync', () => ({
  isICloudPreferenceSyncAvailable: jest.fn(),
  loadPreferencesFromICloud: jest.fn(),
  savePreferencesToICloud: jest.fn(),
  synchronizeICloudPreferences: jest.fn(),
}));

const NOW = 1_700_000_000_000;

const mockIsAvailable = jest.mocked(isICloudPreferenceSyncAvailable);
const mockLoad = jest.mocked(loadPreferencesFromICloud);
const mockSave = jest.mocked(savePreferencesToICloud);
const mockSynchronize = jest.mocked(synchronizeICloudPreferences);

async function mountAndLoad() {
  const hook = renderHook(() => useIcloudPreferenceSync());

  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });

  return hook;
}

async function waitForSaveDebounce() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
}

describe('useIcloudPreferenceSync', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    mockIsAvailable.mockReturnValue(true);
    mockSynchronize.mockResolvedValue(true);
    mockSave.mockResolvedValue();
    mockSave.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('a fresh install restores the iCloud copy and keeps its device-local values', async () => {
    replacePreferences({ ...initialPreferences, landscapeChatWidth: 320 });

    mockLoad.mockResolvedValue({
      ...initialPreferences,
      updatedAt: 100,
      chatTimestamps: true,
    });

    await mountAndLoad();
    await waitForSaveDebounce();

    expect(getPreferences()).toEqual<Preferences>({
      ...initialPreferences,
      updatedAt: 100,
      chatTimestamps: true,
      landscapeChatWidth: 320,
    });

    expect(mockSave).not.toHaveBeenCalled();
  });

  test('keeps newer local preferences and sends them to iCloud', async () => {
    const local: Preferences = {
      ...initialPreferences,
      updatedAt: 200,
      chatTimestamps: true,
    };

    replacePreferences(local);

    mockLoad.mockResolvedValue({ ...initialPreferences, updatedAt: 100 });

    await mountAndLoad();

    expect(mockSave).not.toHaveBeenCalled();

    await waitForSaveDebounce();

    expect(getPreferences()).toEqual<Preferences>(local);

    expect(mockSave.mock.calls).toEqual([[local]]);
  });

  test('sends one write for a run of local edits', async () => {
    replacePreferences({ ...initialPreferences });
    mockLoad.mockResolvedValue(null);

    await mountAndLoad();

    act(() => {
      updatePreferences({ chatTimestamps: true });
      updatePreferences({ animate: true });
    });

    await waitForSaveDebounce();

    expect(mockSave.mock.calls).toEqual([
      [
        {
          ...initialPreferences,
          updatedAt: NOW,
          chatTimestamps: true,
          animate: true,
        },
      ],
    ]);
  });

  test('does not write for a device-local edit', async () => {
    replacePreferences({ ...initialPreferences });
    mockLoad.mockResolvedValue(null);

    await mountAndLoad();

    act(() => {
      updatePreferences({ landscapeChatWidth: 280 });
    });

    await waitForSaveDebounce();

    expect(mockSave).not.toHaveBeenCalled();
  });
});
