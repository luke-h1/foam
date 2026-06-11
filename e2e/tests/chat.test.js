// @ts-check

describe('chat', () => {
  test('opens a stream and shows the chat placeholder while connecting', async () => {
    await waitFor(element(by.text('Top')))
      .toBeVisible()
      .withTimeout(20000);

    await waitFor(element(by.text('Streams')))
      .toBeVisible()
      .withTimeout(10000);
    await waitFor(element(by.text('Blueberry42')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.text('Blueberry42')).tap();

    // The live stream screen should load; wait for the chat sync placeholder
    // or the actual chat input bar to appear
    try {
      await waitFor(element(by.id('chat-sync-placeholder')))
        .toBeVisible()
        .withTimeout(5000);
    } catch {
      await waitFor(element(by.id('chat-input-bar')))
        .toBeVisible()
        .withTimeout(20000);
    }
  });

  test('stream screen renders the stream player area', async () => {
    await waitFor(element(by.text('Top')))
      .toBeVisible()
      .withTimeout(20000);

    await waitFor(element(by.text('Blueberry42')))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.text('Blueberry42')).tap();

    await waitFor(element(by.id('stream-player-container')))
      .toBeVisible()
      .withTimeout(20000);
  });
});
