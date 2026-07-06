/**
 * Latest 7TV EventAPI session id, captured from the HELLO frame. Presence
 * writes attach it so 7TV can push the user's own entitlements to this
 * session, and reconnects use it to RESUME and replay missed dispatches.
 */
let sevenTvSessionId: string | null = null;

export const setSevenTvSessionId = (sessionId: string | null): void => {
  sevenTvSessionId = sessionId;
};

export const getSevenTvSessionId = (): string | null => sevenTvSessionId;
