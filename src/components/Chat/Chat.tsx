import { memo } from 'react';

import { ChatView, type ChatProps } from './ChatView';

export const Chat = memo((props: ChatProps) => {
  return <ChatView {...props} />;
});

Chat.displayName = 'Chat';
