import { useWhispers } from "@app/components/chat/hooks/use-whispers";
import { useAuthContext } from "@app/context/auth-context";
import { useTwitchChat } from "@app/services/twitch-chat-service";

export function useWhisperIrcSession() {
  const { authState } = useAuthContext();
  const { onWhisper, sendWhisper } = useWhispers();
  const isLoggedIn = Boolean(authState?.isLoggedIn);

  useTwitchChat({
    connectForWhispers: isLoggedIn,
    onWhisper,
  });

  return {
    sendWhisper,
  };
}
