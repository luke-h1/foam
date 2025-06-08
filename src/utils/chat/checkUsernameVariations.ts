export async function checkUsernameVariations(
  message: string,
  tmiUsername: string,
): Promise<boolean> {
  const variations = [
    `@${tmiUsername}`,
    tmiUsername,
    `${tmiUsername},`,
    `@${tmiUsername},`,
  ];

  const checks = await Promise.all(
    variations.map(variation =>
      new RegExp(`\\b${variation}\\b`, 'i').test(message),
    ),
  );

  return checks.some(Boolean);
}
