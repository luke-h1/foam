import { router } from "expo-router";

import { normaliseChatUsername } from "@app/utils/chat/chat-usernames/normalise-chat-username";

interface OpenWhisperConversationArgs {
  displayName?: string;
  login: string;
  userId: string;
}

export function openWhisperConversation({
  login,
  userId,
  displayName,
}: OpenWhisperConversationArgs): void {
  const normalisedUsername = normaliseChatUsername(login);

  if (!normalisedUsername || !userId.trim()) {
    return;
  }

  router.push({
    pathname: "/tabs/settings/whispers/[login]",
    params: {
      displayName: displayName?.trim() || normalisedUsername,
      login: normalisedUsername,
      userId: userId.trim(),
    },
  });
}
