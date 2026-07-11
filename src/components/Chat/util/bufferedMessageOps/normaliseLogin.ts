export const normaliseLogin = (value?: string): string =>
  value?.trim().toLowerCase() ?? '';
