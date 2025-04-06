import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './persist';

interface ChatState {}

export const useChatStore = create(
  persist<ChatState>((set, get) => ({}), {
    name: 'chat-store',
    storage: createJSONStorage(() => zustandStorage),
  }),
);
