type MentionSearchTimer = {
  current: ReturnType<typeof setTimeout> | null;
};

export const mentionSearchTimer: MentionSearchTimer = {
  current: null,
};
