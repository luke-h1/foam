import { createContext, PropsWithChildren, use, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Dimensions, DisplayMode, mode } from './dimensions';

type ScreenDimensionsContextDataType = {
  dimensions: Dimensions;
  displayMode: DisplayMode;
};

export const ScreenDimensionsContext = createContext<
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

  const contextValue: ScreenDimensionsContextDataType = useMemo(() => {
    return {
      dimensions: {
        width: Math.ceil(window.width),
        height: Math.ceil(window.height),
      },
      displayMode,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenDimensionsContext.Provider value={contextValue}>
      {children}
    </ScreenDimensionsContext.Provider>
  );
};

// Create a hook for more straightforward usage of context provider
export const useScreenDimensions = () => {
  const context = use(ScreenDimensionsContext);

  if (!context)
    throw new Error(
      'useWindowDimensions must be used within WindowDimensionsProvider',
    );

  return context;
};
