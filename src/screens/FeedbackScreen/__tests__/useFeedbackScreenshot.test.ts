import { act, renderHook } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'sonner-native';

import type { FeedbackAttachment } from '@app/lib/sentry';

import { useFeedbackScreenshot } from '../hooks/useFeedbackScreenshot';

const mockBytes = jest.fn();
let mockFileSize: number | null = 0;

jest.mock('expo-file-system', () => ({
  File: class {
    get size() {
      return mockFileSize;
    }

    bytes = mockBytes;
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    main: {
      error: jest.fn(),
    },
  },
}));

const mockLaunchImageLibrary = jest.mocked(ImagePicker.launchImageLibraryAsync);
const mockToastError = jest.mocked(toast.error);

const pickedAsset = {
  uri: 'file:///tmp/screenshot.png',
  fileName: 'screenshot.png',
  mimeType: 'image/png',
  width: 100,
  height: 100,
} as ImagePicker.ImagePickerAsset;

beforeEach(() => {
  jest.clearAllMocks();
  mockFileSize = 0;
});

test('stores the picked image as a feedback attachment', async () => {
  mockLaunchImageLibrary.mockResolvedValue({
    canceled: false,
    assets: [pickedAsset],
  });
  mockFileSize = 1024;
  mockBytes.mockResolvedValue(new Uint8Array([1, 2, 3]));

  const { result } = renderHook(() => useFeedbackScreenshot());
  await act(async () => {
    await result.current.pickScreenshot();
  });

  expect(result.current.screenshot?.uri).toBe('file:///tmp/screenshot.png');
  expect(result.current.screenshot?.attachment).toEqual<FeedbackAttachment>({
    filename: 'screenshot.png',
    data: new Uint8Array([1, 2, 3]),
    contentType: 'image/png',
  });
});

test('does nothing when the user cancels the picker', async () => {
  mockLaunchImageLibrary.mockResolvedValue({ canceled: true, assets: null });

  const { result } = renderHook(() => useFeedbackScreenshot());
  await act(async () => {
    await result.current.pickScreenshot();
  });

  expect(result.current.screenshot).toBeNull();
  expect(mockBytes).not.toHaveBeenCalled();
});

test('rejects images over the size cap with an error toast', async () => {
  mockLaunchImageLibrary.mockResolvedValue({
    canceled: false,
    assets: [pickedAsset],
  });
  mockFileSize = 6 * 1024 * 1024;

  const { result } = renderHook(() => useFeedbackScreenshot());
  await act(async () => {
    await result.current.pickScreenshot();
  });

  expect(result.current.screenshot).toBeNull();
  expect(mockBytes).not.toHaveBeenCalled();
  expect(mockToastError).toHaveBeenCalled();
});

test('shows an error toast when the image picker throws', async () => {
  mockLaunchImageLibrary.mockRejectedValue(new Error('picker crashed'));

  const { result } = renderHook(() => useFeedbackScreenshot());
  await act(async () => {
    await result.current.pickScreenshot();
  });

  expect(result.current.screenshot).toBeNull();
  expect(mockToastError).toHaveBeenCalled();
});

test('shows an error toast when reading the file fails', async () => {
  mockLaunchImageLibrary.mockResolvedValue({
    canceled: false,
    assets: [pickedAsset],
  });
  mockFileSize = 1024;
  mockBytes.mockRejectedValue(new Error('read failed'));

  const { result } = renderHook(() => useFeedbackScreenshot());
  await act(async () => {
    await result.current.pickScreenshot();
  });

  expect(result.current.screenshot).toBeNull();
  expect(mockToastError).toHaveBeenCalled();
});

test('clearScreenshot removes a stored screenshot', async () => {
  mockLaunchImageLibrary.mockResolvedValue({
    canceled: false,
    assets: [pickedAsset],
  });
  mockFileSize = 1024;
  mockBytes.mockResolvedValue(new Uint8Array([1]));

  const { result } = renderHook(() => useFeedbackScreenshot());
  await act(async () => {
    await result.current.pickScreenshot();
  });
  expect(result.current.screenshot).not.toBeNull();

  act(() => {
    result.current.clearScreenshot();
  });
  expect(result.current.screenshot).toBeNull();
});
