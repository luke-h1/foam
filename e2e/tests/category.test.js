// @ts-check

describe('category detail', () => {
  test('navigates from top categories into a category and shows its streams', async () => {
    await waitFor(element(by.text('Top')))
      .toBeVisible()
      .withTimeout(20000);

    // Switch to Categories tab in the Top segmented control
    await waitFor(element(by.text('Categories')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Categories')).tap();

    // Wait for the categories grid to load
    await waitFor(element(by.text('Just Chatting')))
      .toBeVisible()
      .withTimeout(15000);

    // Tap into Just Chatting
    await element(by.text('Just Chatting')).tap();

    // Category detail screen should show the category name in the header
    await waitFor(element(by.text('Just Chatting')))
      .toBeVisible()
      .withTimeout(15000);

    // At least one stream card from that category should appear
    await waitFor(element(by.text('Blueberry42')))
      .toBeVisible()
      .withTimeout(15000);
  });

  test('shows viewer count on the category detail screen', async () => {
    await waitFor(element(by.text('Top')))
      .toBeVisible()
      .withTimeout(20000);

    await waitFor(element(by.text('Categories')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Categories')).tap();

    await waitFor(element(by.text('Just Chatting')))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.text('Just Chatting')).tap();

    // Viewer count subtitle should appear (e.g. "85K viewers")
    await waitFor(element(by.text(/viewers/)))
      .toBeVisible()
      .withTimeout(15000);
  });
});
