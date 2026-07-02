import { useSelector } from '@legendapp/state/react';

import { videoLatencyDisplay$ } from '../videoLatency';

export const useVideoLatencyDisplay = () => useSelector(videoLatencyDisplay$);
