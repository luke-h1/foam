import * as React from 'react';

import { ChangelogViewProps } from './Changelog.types';

export default function ChangelogView(props: ChangelogViewProps) {
  return (
    <div>
      <iframe
        title='Changelog'
        sandbox=''
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
