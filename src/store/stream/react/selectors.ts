import { useSelector } from '@legendapp/state/react';

import { videoLatencyDisplay$ } from '../observables/videoLatency';

export const useVideoLatencyDisplay = () => useSelector(videoLatencyDisplay$);
