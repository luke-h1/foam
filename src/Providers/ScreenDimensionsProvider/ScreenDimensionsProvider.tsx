import { createContext, PropsWithChildren, useMemo } from 'react';
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
  const { width, height } = useWindowDimensions();

  const contextValue = useMemo<ScreenDimensionsContextDataType>(
    () => ({
      dimensions: {
        width: Math.ceil(width),
        height: Math.ceil(height),
      },
      displayMode: mode({ width, height }),
    }),
    [width, height],
  );

  return (
    <ScreenDimensionsContext.Provider value={contextValue}>
      {children}
    </ScreenDimensionsContext.Provider>
  );
};
