import { PersistedStateStatus, usePersistedState } from '@app/hooks';
import {
  createContext,
  PropsWithChildren,
  use,
  useCallback,
  useMemo,
} from 'react';

import {
  availableColumnCountsPortrait,
  availableOffscreenDrawDistanceWindowSizes,
  INITIAL_GALLERY_SETTINGS,
  availableGalleryGaps,
} from './config';

type GalleryUISettingsDataType = {
  /**
   * Information about the current state of the persisted state.
   * Especially useful when waiting for the state to be restored from the disk.
   */
  stateRestorationStatus: PersistedStateStatus;

  // Gallery gap - selected & available
  galleryGap: number;
  availableGalleryGaps: typeof availableGalleryGaps;
  setGalleryGap: (galleryGap: number) => void;

  /**
   * Derived from the {@link numberOfColumns}.
   */
  numberOfColumns: number;
  availableColumnCounts: typeof availableColumnCountsPortrait;
  setNumberOfColumns: (numberOfColumns: number) => void;

  /**
   * The value is multiplied by {@link Dimensions.get("window").height} to determine offscreen rendering area.
   * A value of 0.25 means rendering extends to 25% of screen height beyond visible area to the top and bottom.
   * A value of `1` will pre-render content one full screen height above and below the viewport.
   */
  offscreenDrawDistanceWindowSize: number;
  setOffscreenDrawDistanceWindowSize: (drawDistance: number) => void;
  availableOffscreenDrawDistanceWindowSizes: typeof availableOffscreenDrawDistanceWindowSizes;
};

/**
 * Gallery UI settings global context
 */
export const GalleryUISettingsContext = createContext<
  GalleryUISettingsDataType | undefined
>(undefined);

/**
 * GalleryUISettings provider
 *
 * Provides all the explicitly set settings fields, as well as available values for each field.
 */
export const GalleryUISettingsProvider = ({ children }: PropsWithChildren) => {
  // Provider state
  const [value, setValue, stateRestorationStatus] = usePersistedState<{
    numberOfColumns: number;
    galleryGap: number;
    offscreenDrawDistanceWindowSize: number;
  }>('galleryUISettings', INITIAL_GALLERY_SETTINGS);

  // Provider state handlers
  const setNumberOfColumns = useCallback(
    (numberOfColumns: number) => {
      setValue(prev => ({
        ...prev,
        numberOfColumns,
      }));
    },
    [setValue],
  );

  const setGalleryGap = useCallback(
    (galleryGap: number) => {
      setValue(prev => ({
        ...prev,
        galleryGap,
      }));
    },
    [setValue],
  );

  const setOffscreenDrawDistanceWindowSize = useCallback(
    (windowSize: number) => {
      setValue(prev => ({
        ...prev,
        offscreenDrawDistanceWindowSize: windowSize,
      }));
    },
    [setValue],
  );

  return (
    <GalleryUISettingsContext.Provider
      value={useMemo(
        () => ({
          ...value,
          setNumberOfColumns,
          setGalleryGap,
          setOffscreenDrawDistanceWindowSize,
          stateRestorationStatus,
          availableGalleryGaps,
          availableColumnCounts: availableColumnCountsPortrait,
          availableOffscreenDrawDistanceWindowSizes,
        }),
        [
          value,
          stateRestorationStatus,
          setGalleryGap,
          setNumberOfColumns,
          setOffscreenDrawDistanceWindowSize,
        ],
      )}
    >
      {children}
    </GalleryUISettingsContext.Provider>
  );
};

export const useGalleryUISettings = (): GalleryUISettingsDataType => {
  const context = use(GalleryUISettingsContext);

  if (!context) {
    throw new Error(
      'useGalleryUISettings must be used within an GalleryUISettingsProvider',
    );
  }

  return context;
};
