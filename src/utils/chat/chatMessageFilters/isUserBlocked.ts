const blockedLoginSets = new WeakMap<{ userLogin: string }[], Set<string>>();

function getBlockedLoginSet(
  blockedUsers: { userLogin: string }[],
): Set<string> {
  let set = blockedLoginSets.get(blockedUsers);
  if (!set) {
    set = new Set(
      blockedUsers.map(blockedUser => blockedUser.userLogin.toLowerCase()),
    );
    blockedLoginSets.set(blockedUsers, set);
  }
  return set;
}

export function isUserBlocked(
  username: string | undefined,
  blockedUsers: { userLogin: string }[],
): boolean {
  if (!username || blockedUsers.length === 0) {
    return false;
  }
  return getBlockedLoginSet(blockedUsers).has(username.toLowerCase());
}
