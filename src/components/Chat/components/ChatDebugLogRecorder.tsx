import { useEffect } from 'react';

import {
  acquireChatDebugLog,
  releaseChatDebugLog,
} from '@app/store/chat/actions/chatDebugLog';

export function ChatDebugLogRecorder({
  channelId,
  channelName,
}: {
  channelId: string;
  channelName: string;
}) {
  useEffect(() => {
    acquireChatDebugLog(channelId, channelName);
    return () => releaseChatDebugLog(channelId, channelName);
  }, [channelId, channelName]);

  return null;
}
