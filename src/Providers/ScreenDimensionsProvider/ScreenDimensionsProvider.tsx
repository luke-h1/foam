import { createContext, PropsWithChildren } from 'react';
import { useWindowDimensions } from 'react-native';
import { Dimensions, DisplayMode, mode } from './dimensions';

type ScreenDimensionsContextDataType = {
  dimensions: Dimensions;
  displayMode: DisplayMode;
};

const ScreenDimensionsContext = createContext<
  ScreenDimensionsContextDataType | undefined
>(undefined);

/**
 * Screen dimensions provider.
 *
 * Each `useWindowDimensions` hook call registers a separate listener.
 * Ideally, we want only one instance (singleton) to avoid multiple listeners.
 * This pattern uses a single, global instance of `useWindowDimensions`,
 * reducing unnecessary re-renders.
 */

export const ScreenDimensionsProvider = ({ children }: PropsWithChildren) => {
  // This is a recommended (and responsive) way to obtain screen dimensions siześ
  const window = useWindowDimensions();

  // Calculate display mode based on the window dimensions
  const displayMode = mode(window);

  const contextValue: ScreenDimensionsContextDataType = {
    dimensions: {
      width: Math.ceil(window.width),
      height: Math.ceil(window.height),
    },
    displayMode,
  };

  return (
    <ScreenDimensionsContext.Provider value={contextValue}>
      {children}
    </ScreenDimensionsContext.Provider>
  );
};
