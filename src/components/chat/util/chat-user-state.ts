let currentUserState: Record<string, string> = {};

const userStateListeners = new Set<() => void>();

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

export function releaseChatUserState(owner: symbol): void {
  if (currentOwner !== owner) {
    return;
  }

  currentOwner = null;
  setChatUserState({});
}
