export interface ReplyFields {
  parentDisplayName: string;
  replyParentLogin: string;
  replyBody: string;
}

export function getReplyFields(
  tags: Record<string, string | undefined>,
): ReplyFields {
  return {
    parentDisplayName: tags['reply-parent-display-name'] || '',
    replyParentLogin: tags['reply-parent-user-login'] || '',
    replyBody: tags['reply-parent-msg-body'] || '',
  };
}
