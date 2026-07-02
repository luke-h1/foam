import type { PropsWithChildren } from 'react';

import { BottomSheetProvider } from '@swmansion/react-native-bottom-sheet';

export function AppBottomSheetProvider({ children }: PropsWithChildren) {
  return <BottomSheetProvider>{children}</BottomSheetProvider>;
}
