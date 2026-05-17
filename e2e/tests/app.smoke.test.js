// @ts-check

const { expect: detoxExpect } = require('detox');

describe('smoke', () => {
  test('launches the app and shows the main tabs', async () => {
    await waitFor(element(by.text('Top')))
      .toBeVisible()
      .withTimeout(20000);

    await detoxExpect(element(by.text('Search'))).toBeVisible();
    await detoxExpect(element(by.text('Settings'))).toBeVisible();
  });
});
