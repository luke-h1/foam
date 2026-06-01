import { BottomSheetProvider } from '@swmansion/react-native-bottom-sheet';
import type { PropsWithChildren } from 'react';

export function AppBottomSheetProvider({ children }: PropsWithChildren) {
  return <BottomSheetProvider>{children}</BottomSheetProvider>;
}
