import * as React from 'react';
import { View } from 'react-native';

import type { ChangelogViewProps } from './Changelog.types';

export default function ChangelogView(props: ChangelogViewProps) {
  const { onLoad, style, url } = props;

  React.useEffect(() => {
    onLoad({ nativeEvent: { url } });
  }, [onLoad, url]);

  return <View style={style} />;
}
