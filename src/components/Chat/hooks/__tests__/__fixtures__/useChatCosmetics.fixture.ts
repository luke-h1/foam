type CachedCosmeticsMocks = {
  getUserBadgeId: jest.MockedFunction<
    (ttvUserId: string) => string | undefined
  >;
  getUserPaintId: jest.MockedFunction<
    (ttvUserId: string) => string | undefined
  >;
};

export function setCachedCosmetics(
  mocks: CachedCosmeticsMocks,
  {
    badgeId,
    paintId,
    twitchUserId,
  }: {
    badgeId?: string;
    paintId?: string;
    twitchUserId: string;
  },
): void {
  mocks.getUserBadgeId.mockImplementation(userId =>
    userId === twitchUserId ? badgeId : undefined,
  );
  mocks.getUserPaintId.mockImplementation(userId =>
    userId === twitchUserId ? paintId : undefined,
  );
}
