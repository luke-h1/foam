import { CUSTOM_TAB_BAR_HEIGHT } from '@app/components/MotionTabs/constants';

// This is a shim for web and Android where the tab bar is generally opaque.
export default undefined;

export function useBottomTabOverflow() {
  return CUSTOM_TAB_BAR_HEIGHT;
}
