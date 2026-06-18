import { kappaService } from '@app/services/kappa-service';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'sonner-native';
import { useChatImageUpload } from '../useChatImageUpload';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

jest.mock('@app/services/kappa-service', () => ({
  kappaService: {
    upload: jest.fn(),
  },
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      error: jest.fn(),
    },
  },
}));

const mockLaunchImageLibrary = jest.mocked(ImagePicker.launchImageLibraryAsync);
const mockRequestPermissions = jest.mocked(
  ImagePicker.requestMediaLibraryPermissionsAsync,
);
const mockUpload = jest.mocked(kappaService.upload);
const mockToastError = jest.mocked(toast.error);
const mockToastSuccess = jest.mocked(toast.success);

const pickedAsset = {
  uri: 'file:///tmp/photo.jpg',
  fileName: 'photo.jpg',
  mimeType: 'image/jpeg',
  width: 100,
  height: 100,
} as ImagePicker.ImagePickerAsset;

beforeEach(() => {
  jest.clearAllMocks();
});

it('uploads the picked image without requesting media library permission', async () => {
  mockLaunchImageLibrary.mockResolvedValue({
    canceled: false,
    assets: [pickedAsset],
  });
  mockUpload.mockResolvedValue({ link: 'https://kappa.lol/abc123' });
  const onUploaded = jest.fn();

  const { result } = renderHook(() => useChatImageUpload(onUploaded));
  await act(async () => {
    await result.current.pickAndUpload();
  });

  expect(mockRequestPermissions).not.toHaveBeenCalled();
  expect(mockUpload).toHaveBeenCalledWith({
    uri: 'file:///tmp/photo.jpg',
    fileName: 'photo.jpg',
    mimeType: 'image/jpeg',
  });
  expect(onUploaded).toHaveBeenCalledWith('https://kappa.lol/abc123');
  expect(mockToastSuccess).toHaveBeenCalled();
});

it('does nothing when the user cancels the picker', async () => {
  mockLaunchImageLibrary.mockResolvedValue({ canceled: true, assets: null });
  const onUploaded = jest.fn();

  const { result } = renderHook(() => useChatImageUpload(onUploaded));
  await act(async () => {
    await result.current.pickAndUpload();
  });

  expect(mockUpload).not.toHaveBeenCalled();
  expect(onUploaded).not.toHaveBeenCalled();
});

it('shows an error toast when the upload fails', async () => {
  mockLaunchImageLibrary.mockResolvedValue({
    canceled: false,
    assets: [pickedAsset],
  });
  mockUpload.mockRejectedValue(
    new Error('kappa upload failed with status 500'),
  );
  const onUploaded = jest.fn();

  const { result } = renderHook(() => useChatImageUpload(onUploaded));
  await act(async () => {
    await result.current.pickAndUpload();
  });

  await waitFor(() => {
    expect(mockToastError).toHaveBeenCalled();
  });
  expect(onUploaded).not.toHaveBeenCalled();
});
