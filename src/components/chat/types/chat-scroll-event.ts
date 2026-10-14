import type { NativeScrollEvent } from 'react-native';

/**
 * The part of a scroll event the chat scroll logic reads. LegendList and the
 * native chat list both produce it.
 */
export interface ChatScrollEvent {
  nativeEvent: Pick<
    NativeScrollEvent,
    'contentOffset' | 'contentSize' | 'layoutMeasurement'
  >;
}
