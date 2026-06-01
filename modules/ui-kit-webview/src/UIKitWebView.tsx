import { requireNativeView } from 'expo';
import * as React from 'react';

import type { UIKitWebViewProps } from './UIKitWebView.types';

const NativeView: React.ComponentType<UIKitWebViewProps> =
  requireNativeView('UIKitWebView');

export function UIKitWebView(props: UIKitWebViewProps) {
  return <NativeView {...props} />;
}
