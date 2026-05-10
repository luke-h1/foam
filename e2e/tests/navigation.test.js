describe('navigation', () => {
  test('browses top streams and opens a stream', async () => {
    await waitFor(element(by.id('top-tab-streams')))
      .toBeVisible()
      .withTimeout(20000);
    await waitFor(element(by.id('top-tab-streams')))
      .toBeVisible()
      .withTimeout(10000);

    await waitFor(element(by.text('Blueberry42')))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.text('Blueberry42')).tap();

    await waitFor(element(by.id('chat-sync-placeholder')))
      .toBeVisible()
      .withTimeout(15000);
  });

  test('browses top categories', async () => {
    await waitFor(element(by.id('top-tab-categories')))
      .toBeVisible()
      .withTimeout(20000);
    await waitFor(element(by.id('top-tab-categories')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('top-tab-categories')).tap();

    await waitFor(element(by.text('Just Chatting')))
      .toBeVisible()
      .withTimeout(15000);
  });
});
