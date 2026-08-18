import { forwardRef, useImperativeHandle } from 'react';
import { View, type ViewProps } from 'react-native';

export interface MockImageHandle {
  startAnimating: () => void;
  stopAnimating: () => void;
}

interface MockImageStatics {
  prefetch: jest.Mock;
  loadAsync: jest.Mock;
  clearMemoryCache: jest.Mock;
  clearDiskCache: jest.Mock;
}

const ImageComponent = forwardRef<MockImageHandle, ViewProps>((props, ref) => {
  useImperativeHandle(ref, () => ({
    startAnimating: jest.fn(),
    stopAnimating: jest.fn(),
  }));

  return <View testID='expo-image' {...props} />;
});
ImageComponent.displayName = 'Image';

/**
 * SAFETY: the real Image is a class exposing these as static members;
 * jest.fn() stands in as a faithful, assertable fake for each one.
 */
export const Image = Object.assign(ImageComponent, {
  prefetch: jest.fn(() => Promise.resolve(true)),
  loadAsync: jest.fn(() => Promise.resolve({})),
  clearMemoryCache: jest.fn(() => Promise.resolve(true)),
  clearDiskCache: jest.fn(() => Promise.resolve(true)),
} satisfies MockImageStatics);
