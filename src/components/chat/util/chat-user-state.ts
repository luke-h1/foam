/**
 * Session-scoped IRC user state, read imperatively by the composer and
 * reactively through `useChatUserState`. Each USERSTATE or GLOBALUSERSTATE
 * replaces the record.
 */
let currentUserState: Record<string, string> = {};

const userStateListeners = new Set<() => void>();

/**
 * A channel switch mounts the next chat before the old one cleans up, so only
 * the owner may write. This stops the departing channel clobbering the new state.
 */
let currentOwner: symbol | null = null;

function setChatUserState(next: Record<string, string>): void {
  currentUserState = next;
  userStateListeners.forEach(listener => listener());
}

export function getChatUserState(): Record<string, string> {
  return currentUserState;
}

export function subscribeChatUserState(listener: () => void): () => void {
  userStateListeners.add(listener);

  return () => {
    userStateListeners.delete(listener);
  };
}

export function claimChatUserState(owner: symbol): void {
  currentOwner = owner;
}

export function setChatUserStateIfOwner(
  owner: symbol,
  next: Record<string, string>,
): void {
  if (currentOwner === owner) {
    setChatUserState(next);
  }
}

/**
 * Clears the state, but only for the owner, so a late cleanup of the previous
 * chat leaves the new chat's state alone.
 */
export function releaseChatUserState(owner: symbol): void {
  if (currentOwner !== owner) {
    return;
  }

  currentOwner = null;
  setChatUserState({});
}
