import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
  presentIosActionSheet,
  type PresentIosActionSheetOptions,
} from '@app/components/Chat/util/presentIosActionSheet';

/**
 * Presents a native UIAlertController action sheet whenever `visible` flips
 * on. Options are read through a ref at presentation time, so callers can
 * rebuild them every render without re-triggering the presentation.
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
