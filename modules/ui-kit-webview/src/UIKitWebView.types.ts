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

export type UIKitWebViewMessageEvent = {
  data: string;
};

export type UIKitWebViewProps = {
  allowsFullscreenVideo?: boolean;
  debugRawTwitchPlayerBridge?: boolean;
  injectedJavaScript?: string;
  javaScriptCommand?: string;
  keyboardDisplayRequiresUserAction?: boolean;
  onContentProcessDidTerminate?: (event: {
    nativeEvent: UIKitWebViewContentProcessTerminatedEvent;
  }) => void;
  onError?: (event: { nativeEvent: UIKitWebViewErrorEvent }) => void;
  onLoadEnd?: (event: { nativeEvent: UIKitWebViewNavigationEvent }) => void;
  onLoadStart?: (event: { nativeEvent: UIKitWebViewNavigationEvent }) => void;
  onMessage?: (event: { nativeEvent: UIKitWebViewMessageEvent }) => void;
  onNavigationStateChange?: (event: {
    nativeEvent: UIKitWebViewNavigationEvent;
  }) => void;
  parent?: string;
  playerWebsiteUrl?: string;
  rawTwitchPlayerAutoplay?: boolean;
  rawTwitchPlayerBridgeEnabled?: boolean;
  restrictNavigationToTwitchPlayer?: boolean;
  scrollEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
  url: string;
};
