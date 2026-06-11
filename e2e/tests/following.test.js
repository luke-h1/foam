// @ts-check

describe('following', () => {
  test('shows sign-in prompt on the following tab when not authenticated', async () => {
    await waitFor(element(by.text('Top')))
      .toBeVisible()
      .withTimeout(20000);

    // The tab bar should have a Following tab
    await waitFor(element(by.text('Following')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Following')).tap();

    // Unauthenticated state: sign-in prompt
    await waitFor(element(by.text('Your followed streams')))
      .toBeVisible()
      .withTimeout(15000);

    await waitFor(element(by.text('Sign In')))
      .toBeVisible()
      .withTimeout(10000);
  });

  test('following tab sign-in button opens auth sheet', async () => {
    await waitFor(element(by.text('Top')))
      .toBeVisible()
      .withTimeout(20000);

    await element(by.text('Following')).tap();

    await waitFor(element(by.text('Sign In')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.text('Sign In')).tap();

    // Auth sheet should appear
    await waitFor(element(by.text('Sign in with Twitch')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
