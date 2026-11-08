import { useCallback, useRef } from 'react';

import type { BottomSheetHandle } from '@app/components/bottom-sheet/BottomSheet';

export function useChatSheet() {
  const sheetRef = useRef<BottomSheetHandle>(null);

  const requestClose = useCallback(() => {
    sheetRef.current?.requestClose();
  }, []);

  const runAndClose = useCallback(
    (action?: () => void) => {
      action?.();
      requestClose();
    },
    [requestClose],
  );

  return { requestClose, runAndClose, sheetRef };
}
