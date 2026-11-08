import { chatStore$ } from '../observables/chat-store';

export const setCurrentChannelId = (channelId: string | null) => {
  chatStore$.currentChannelId.set(channelId);
};
