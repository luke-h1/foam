import * as React from 'react';
import { View } from 'react-native';

import type { UIKitWebViewProps } from './UIKitWebView.types';

export function UIKitWebView(props: UIKitWebViewProps) {
  return <View style={props.style} />;
}
