import { forwardRef } from 'react';
import {
  StreamPlayer,
  StreamPlayerPrewarm,
  type StreamPlayerProps,
  type StreamPlayerRef,
} from './StreamPlayer';

export const StreamPlayerWebViewUrlExperiment = forwardRef<
  StreamPlayerRef,
  StreamPlayerProps
>(function StreamPlayerWebViewUrlExperiment(props, ref) {
  return (
    <StreamPlayer
      ref={ref}
      {...props}
      restrictWebViewNavigationToTwitchPlayer
    />
  );
});

export function StreamPlayerWebViewUrlExperimentPrewarm({
  parent = 'foam-app.com',
}: {
  parent?: string;
}) {
  return <StreamPlayerPrewarm parent={parent} />;
}
