import { useSelector } from '@legendapp/state/react';

import { videoLatencyDisplay$ } from '../video-latency';

export const useVideoLatencyDisplay = () => useSelector(videoLatencyDisplay$);
