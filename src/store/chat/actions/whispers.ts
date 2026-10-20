import { normaliseChatUsername } from "@app/utils/chat/chat-usernames/normalise-chat-username";
import {
  MAX_WHISPER_MESSAGES_PER_THREAD,
  WhisperMessage,
  WhisperThread,
} from "../types/whispers";
import { whisperThreads$ } from "../observables/whispers";

export function getWhisperThread(login: string): WhisperThread | undefined {
  const username = normaliseChatUsername(login);

  if (!username) {
    return undefined;
  }

  return whisperThreads$[username]?.peek();
}

export function addWhisperMessage(
  partner: {
    userId?: string;
    login: string;
    displayName?: string;
    profileImageUrl?: string;
  },
  message: WhisperMessage,
): void {
  const username = normaliseChatUsername(partner.login);

  if (!username) {
    return;
  }

  const existing = whisperThreads$[username]?.peek();

  const messages = [...(existing?.messages ?? []), message].slice(
    -MAX_WHISPER_MESSAGES_PER_THREAD,
  );

  whisperThreads$[username]?.set({
    partnerUserId: partner.userId || existing?.partnerUserId || "",
    partnerLogin: username,
    partnerDisplayName:
      partner.displayName || existing?.partnerDisplayName || partner.login,
    partnerProfileImageUrl:
      partner.profileImageUrl || existing?.partnerProfileImageUrl,
    messages,
    unreadCount: message.isOutgoing
      ? (existing?.unreadCount ?? 0)
      : (existing?.unreadCount ?? 0) + 1,
    lastMessageAt: message.receivedAt,
  });
}

export function markWhisperThreadRead(login: string): void {
  const username = normaliseChatUsername(login);
  const existing = username ? whisperThreads$[username]?.peek() : undefined;

  if (!existing || existing.unreadCount === 0) {
    return;
  }

  whisperThreads$[username]?.unreadCount.set(0);
}

export function clearWhisperThreads(): void {
  whisperThreads$.set({});
}

export function getTotalUnreadWhispers(): number {
  return Object.values(whisperThreads$.peek()).reduce(
    (total, thread) => total + thread.unreadCount,
    0,
  );
}
