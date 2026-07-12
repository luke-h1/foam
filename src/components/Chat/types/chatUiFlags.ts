export type ChatConnectionFlags = {
  isAuthenticated: boolean;
  isConnected: boolean;
  isSending: boolean;
};

export type ChatPaneFlags = {
  canModerateChat: boolean;
  connected: boolean;
  shouldMaintainScrollAtEnd: boolean;
  showOnlyMentions: boolean;
};

export type ChatMessageDisplayFlags = {
  disableEmoteAnimations?: boolean;
  isAlternatingRow?: boolean;
  isChannelPointRedemption?: boolean;
  isAnnouncement?: boolean;
  isHighlightedMessage?: boolean;
  isSharedChatDuplicated?: boolean;
  isHighlightedMessageTarget?: boolean;
  isTwitchSystemNotice?: boolean;
  showInlineReplyContext?: boolean;
  showTimestamp?: boolean;
};

export type ChatModerationAccessFlags = {
  canModerateChat: boolean;
  canModerateUser?: boolean;
};

export type UserActionVisibilityFlags = {
  isHidden: boolean;
  isHighlighted: boolean;
  visible: boolean;
};

export type ChatRowDisplayFlags = {
  animate: boolean;
  disableEmoteAnimations: boolean;
  fontScale?: 'small' | 'default' | 'large';
  showAlternatingChatRows: boolean;
  showInlineReplyContext: boolean;
  showTimestamps: boolean;
};
