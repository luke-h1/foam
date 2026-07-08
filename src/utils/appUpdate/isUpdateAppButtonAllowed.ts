function normaliseLogin(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

/**
 * Gate for the "update app" button in Settings.
 *
 * An empty allow-list means the button is visible to everyone. Otherwise only
 * Twitch logins on the list can see it.
 */
export function isUpdateAppButtonAllowed(
  login: string | null | undefined,
  allowedUsers: readonly string[],
): boolean {
  if (allowedUsers.length === 0) {
    return true;
  }

  const normalised = normaliseLogin(login);

  if (!normalised) {
    return false;
  }

  return allowedUsers.some(user => normaliseLogin(user) === normalised);
}
