import { useSelector } from "@legendapp/state/react";

import { normaliseChatUsername } from "@app/utils/chat/chat-usernames/normalise-chat-username";

import { whisperThreads$ } from "../observables/whispers";
import { WhisperThread } from "../types/whispers";

export function useWhisperThread(login: string): WhisperThread | undefined {
  const username = normaliseChatUsername(login);

  return useSelector(() =>
    username ? whisperThreads$[username]?.get() : undefined,
  );
}

export function useWhisperThreads(): WhisperThread[] {
  return useSelector(() =>
    Object.values(whisperThreads$.get()).sort(
      (a, b) => b.lastMessageAt - a.lastMessageAt,
    ),
  );
}

export function useUnreadWhisperCount(): number {
  return useSelector(() =>
    Object.values(whisperThreads$.get()).reduce(
      (total, thread) => total + thread.unreadCount,
      0,
    ),
  );
}
