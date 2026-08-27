/**
 * Latest 7TV EventAPI session id from the HELLO frame; presence writes attach
 * it and reconnects use it to RESUME.
 */
let sevenTvSessionId: string | null = null;

export const setSevenTvSessionId = (sessionId: string | null): void => {
  sevenTvSessionId = sessionId;
};

export const getSevenTvSessionId = (): string | null => sevenTvSessionId;
