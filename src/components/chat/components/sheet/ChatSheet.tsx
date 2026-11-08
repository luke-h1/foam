import type { ReactNode, Ref } from 'react';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/bottom-sheet/BottomSheet';

import { useChatSheetHeight } from './hooks/use-chat-sheet-height';
import {
  type ChatSheetLayout,
  getChatSheetSnapPoints,
} from './util/chatSheetLayout';

interface ChatSheetProps {
  children: ReactNode;
  layout: ChatSheetLayout;
  onDismiss: () => void;
  ref: Ref<BottomSheetHandle>;
  testID: string;
}

export function ChatSheet({
  children,
  layout,
  onDismiss,
  ref,
  testID,
}: ChatSheetProps) {
  const sheetHeight = useChatSheetHeight(layout);

  return (
    <BottomSheet
      ref={ref}
      enableFixedSnapPoints
      isPresented
      onDismiss={onDismiss}
      showDragIndicator
      snapPoints={getChatSheetSnapPoints(layout, sheetHeight)}
      testID={testID}
    >
      {children}
    </BottomSheet>
  );
}
