import { requireNativeView } from 'expo';
import * as React from 'react';

import { ChangelogViewProps } from './Changelog.types';

const NativeView: React.ComponentType<ChangelogViewProps> =
  requireNativeView('Changelog');

export default function ChangelogView(props: ChangelogViewProps) {
  return <NativeView {...props} />;
}
