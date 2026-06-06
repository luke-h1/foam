export type ChatPreferenceFlags = {
  chatDensity: 'comfortable' | 'compact';
  disableEmoteAnimations: boolean;
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showTimestamps: boolean;
  showUnreadJumpPill: boolean;
};

export type ChatConnectionFlags = {
  isAuthenticated: boolean;
  isConnected: boolean;
  isSending: boolean;
};

export type ChatPinFlags = {
  canPinNextMessage?: boolean;
  onTogglePinNextMessage?: () => void;
  pinNextMessage?: boolean;
};

export type ChatPaneFlags = {
  canModerateChat: boolean;
  connected: boolean;
  shouldMaintainScrollAtEnd: boolean;
  showOnlyMentions: boolean;
  showTimestamps: boolean;
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

export type SettingsSheetPreferenceFlags = {
  chatDensity?: 'comfortable' | 'compact';
  highlightOwnMentions?: boolean;
  showInlineReplyContext?: boolean;
  showTimestamps?: boolean;
  showUnreadJumpPill?: boolean;
};

export type ChatRowDisplayFlags = {
  disableEmoteAnimations: boolean;
  showAlternatingChatRows: boolean;
  showInlineReplyContext: boolean;
  showTimestamps: boolean;
};
