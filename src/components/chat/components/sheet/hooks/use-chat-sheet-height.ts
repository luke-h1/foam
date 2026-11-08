import { useWindowDimensions } from 'react-native';

import {
  type ChatSheetLayout,
  getChatSheetHeight,
} from '../util/chatSheetLayout';

export function useChatSheetHeight(layout: ChatSheetLayout): number {
  const { height: windowHeight } = useWindowDimensions();

  return getChatSheetHeight(layout, windowHeight);
}
