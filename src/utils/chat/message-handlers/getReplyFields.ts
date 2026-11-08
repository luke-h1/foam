export interface ReplyFields {
  parentDisplayName: string;
  /**
   * Holds the reply parent's login, which the store registers in the mention
   * index and the row compares with the viewer's login.
   */
  replyDisplayName: string;
  replyBody: string;
}

export function getReplyFields(
  tags: Record<string, string | undefined>,
): ReplyFields {
  return {
    parentDisplayName: tags['reply-parent-display-name'] || '',
    replyDisplayName: tags['reply-parent-user-login'] || '',
    replyBody: tags['reply-parent-msg-body'] || '',
  };
}
