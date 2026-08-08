import { useEffect } from 'react';

import {
  acquireChatDebugLog,
  clearChatDebugLog,
  releaseChatDebugLog,
} from '@app/store/chat/actions/chatDebugLog';

export function ChatDebugLogRecorder({ channelId }: { channelId: string }) {
  useEffect(() => {
    acquireChatDebugLog();
    return () => releaseChatDebugLog();
  }, []);

  useEffect(() => {
    clearChatDebugLog();
  }, [channelId]);

  return null;
}
