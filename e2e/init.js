// @ts-check

jest.setTimeout(120000);

beforeEach(async () => {
  await device.launchApp({
    newInstance: true,
    delete: true,
  });
});
