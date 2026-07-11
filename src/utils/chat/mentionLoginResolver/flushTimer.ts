export const flushTimer: { current: ReturnType<typeof setTimeout> | null } = {
  current: null,
};
