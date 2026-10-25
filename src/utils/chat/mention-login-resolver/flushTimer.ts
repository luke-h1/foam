type MentionFlushTimer = {
  current: ReturnType<typeof setTimeout> | null;
};

export const flushTimer: MentionFlushTimer = {
  current: null,
};
