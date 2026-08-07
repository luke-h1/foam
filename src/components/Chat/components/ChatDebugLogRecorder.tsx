import { useEffect } from 'react';

import {
  acquireChatDebugLog,
  clearChatDebugLog,
  releaseChatDebugLog,
} from '@app/store/chat/actions/chatDebugLog';
import { useDevToolsAccess } from '@app/utils/devTools/devToolsGate';

export function ChatDebugLogRecorder({ channelId }: { channelId: string }) {
  const enabled = useDevToolsAccess() === 'enabled';

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    acquireChatDebugLog();
    return () => releaseChatDebugLog();
  }, [enabled]);

  useEffect(() => {
    clearChatDebugLog();
  }, [channelId]);

  return null;
}
