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
  disableEmoteAnimations?: boolean | undefined;
  isAlternatingRow?: boolean | undefined;
  isChannelPointRedemption?: boolean | undefined;
  isAnnouncement?: boolean | undefined;
  isHighlightedMessage?: boolean | undefined;
  isSharedChatDuplicated?: boolean | undefined;
  isHighlightedMessageTarget?: boolean | undefined;
  isTwitchSystemNotice?: boolean | undefined;
  showInlineReplyContext?: boolean | undefined;
  showTimestamp?: boolean | undefined;
};

export type ChatModerationAccessFlags = {
  canModerateChat: boolean;
  canModerateUser?: boolean | undefined;
};

export type UserActionVisibilityFlags = {
  isHidden: boolean;
  isHighlighted: boolean;
  visible: boolean;
};

export type ChatRowDisplayFlags = {
  animate: boolean;
  disableEmoteAnimations: boolean;
  fontScale?: 'small' | 'default' | 'large' | undefined;
  showAlternatingChatRows: boolean;
  showInlineReplyContext: boolean;
  showTimestamps: boolean;
};
