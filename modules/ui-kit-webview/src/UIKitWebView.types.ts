import type { StyleProp, ViewStyle } from 'react-native';

export type UIKitWebViewNavigationEvent = {
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  title?: string | null;
  url: string;
};

export type UIKitWebViewErrorEvent = {
  code: number;
  description: string;
  domain: string;
  url: string;
};

export type UIKitWebViewContentProcessTerminatedEvent = {
  url: string;
};

export type UIKitWebViewProps = {
  allowsFullscreenVideo?: boolean;
  keyboardDisplayRequiresUserAction?: boolean;
  onContentProcessDidTerminate?: (event: {
    nativeEvent: UIKitWebViewContentProcessTerminatedEvent;
  }) => void;
  onError?: (event: { nativeEvent: UIKitWebViewErrorEvent }) => void;
  onLoadEnd?: (event: { nativeEvent: UIKitWebViewNavigationEvent }) => void;
  onLoadStart?: (event: { nativeEvent: UIKitWebViewNavigationEvent }) => void;
  onNavigationStateChange?: (event: {
    nativeEvent: UIKitWebViewNavigationEvent;
  }) => void;
  parent?: string;
  playerWebsiteUrl?: string;
  restrictNavigationToTwitchPlayer?: boolean;
  scrollEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
  url: string;
};
