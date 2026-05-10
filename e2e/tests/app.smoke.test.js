describe('smoke', () => {
  test('launches the app and shows the main tabs', async () => {
    await waitFor(element(by.text('Top')))
      .toBeVisible()
      .withTimeout(20000);

    await expect(element(by.text('Search'))).toBeVisible();
    await expect(element(by.text('Settings'))).toBeVisible();
  });
});
