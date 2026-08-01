import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
  presentIosActionSheet,
  type PresentIosActionSheetOptions,
} from '@app/components/Chat/util/presentIosActionSheet';

/**
 * Presents an ActionSheetIOS sheet on the rising edge of `visible`; options
 * are read through a ref so per-render rebuilds never re-present.
 */
export function useIosActionSheet(
  visible: boolean,
  getOptions: () => PresentIosActionSheetOptions,
): void {
  const getOptionsRef = useRef(getOptions);
  useEffect(() => {
    getOptionsRef.current = getOptions;
  });

  const presentedRef = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    if (!visible) {
      presentedRef.current = false;
      return;
    }
    if (presentedRef.current) {
      return;
    }
    presentedRef.current = true;
    presentIosActionSheet(getOptionsRef.current());
  }, [visible]);
}
