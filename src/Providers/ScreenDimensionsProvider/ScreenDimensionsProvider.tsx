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
 * One global useWindowDimensions instance: every hook call registers its own
 * listener, so sharing one cuts listeners and re-renders.
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
