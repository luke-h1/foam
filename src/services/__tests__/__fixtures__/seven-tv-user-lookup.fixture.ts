/**
 * Real `UserByConnection` response bodies, so the parser is exercised against
 * the payload shape 7TV actually returns.
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
