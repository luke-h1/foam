export type BadgesLoadedListener = {
  current: (() => void) | null;
};

export const onBadgesLoaded: BadgesLoadedListener = {
  current: null,
};
