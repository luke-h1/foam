import { useCallback } from "react";

import { useAuthContext } from "@app/context/auth-context";
import { twitchService } from "@app/services/twitch-service";
import { addWhisperMessage } from "@app/store/chat/actions/whispers";
import { logger } from "@app/utils/logger";

interface SendWhisperPartner {
  userId: string;
  login: string;
  displayName?: string;
}

export function useWhispers() {
  const { user } = useAuthContext();

  const onWhisper = useCallback(
    (senderLogin: string, tags: Record<string, string>, body: string) => {
      addWhisperMessage(
        {
          userId: tags["user-id"],
          login: senderLogin,
          displayName: tags["display-name"] || senderLogin,
        },
        {
          id: tags["message-id"] || `${senderLogin}-${Date.now()}`,
          body,
          senderLogin,
          senderDisplayName: tags["display-name"] || senderLogin,
          senderColor: tags.color || undefined,
          isOutgoing: false,
          receivedAt: Date.now(),
        },
      );
    },
    [],
  );

  const sendWhisper = useCallback(
    async (partner: SendWhisperPartner, body: string): Promise<boolean> => {
      const trimmed = body.trim();

      if (!trimmed || !user?.id || !partner.userId) {
        return false;
      }

      try {
        await twitchService.sendWhisper({
          fromUserId: user.id,
          message: trimmed,
          toUserId: partner.userId,
        });
      } catch (error) {
        logger.chat.error("Failed to send whisper", error);
        return false;
      }

      addWhisperMessage(partner, {
        id: `outgoing-${Date.now()}`,
        body: trimmed,
        senderLogin: user.login ?? "",
        senderDisplayName: user.display_name || user.login || "",
        isOutgoing: true,
        receivedAt: Date.now(),
      });

      return true;
    },
    [user?.display_name, user?.id, user?.login],
  );

  return { onWhisper, sendWhisper };
}
