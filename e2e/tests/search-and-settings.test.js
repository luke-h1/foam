// @ts-check

describe('search and settings', () => {
  test('searches channels and categories', async () => {
    await waitFor(element(by.text('Search')))
      .toBeVisible()
      .withTimeout(20000);

    await element(by.text('Search')).tap();
    await waitFor(element(by.id('search-input')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('search-input')).tap();
    await element(by.id('search-input')).typeText('blueberry');
    await waitFor(element(by.text('Blueberry42')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id('search-input')).clearText();
    await element(by.id('search-input')).typeText('fortnite');
    await waitFor(element(by.text('Fortnite')))
      .toBeVisible()
      .withTimeout(15000);
  });

  test('opens developer debug tools from settings', async () => {
    await waitFor(element(by.text('Settings')))
      .toBeVisible()
      .withTimeout(20000);

    await element(by.text('Settings')).tap();
    await waitFor(element(by.text('Dev Tools')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.text('Dev Tools')).tap();
    await waitFor(element(by.text('Debug')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Debug')).tap();

    await waitFor(element(by.text('RQ DevTools')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
