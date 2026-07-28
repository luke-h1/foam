/**
 * Response bodies matching what 7TV's v4 GQL returns for the
 * `UserByConnection` query, so the service's worklet parser is exercised
 * against the real payload shape rather than a hand-shaped object.
 */
export const sevenTvUserResponse = (
  userId: string,
  activeEmoteSetId: string | null,
) =>
  JSON.stringify({
    data: {
      users: { userByConnection: { id: userId, style: { activeEmoteSetId } } },
    },
  });

export const noSevenTvUserResponse = JSON.stringify({
  data: { users: { userByConnection: null } },
});

export const sevenTvGqlErrorResponse = JSON.stringify({
  errors: [{ message: 'user not found' }],
});
