let sevenTvSessionId: string | null = null;

export const setSevenTvSessionId = (sessionId: string | null): void => {
  sevenTvSessionId = sessionId;
};

export const getSevenTvSessionId = (): string | null => sevenTvSessionId;
