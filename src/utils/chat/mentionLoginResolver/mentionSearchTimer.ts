export const mentionSearchTimer: {
  current: ReturnType<typeof setTimeout> | null;
} = {
  current: null,
};
