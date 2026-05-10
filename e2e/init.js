const detox = require('detox');

jest.setTimeout(120000);

beforeAll(async () => {
  await detox.init();
}, 300000);

beforeEach(async () => {
  await device.launchApp({
    newInstance: true,
    delete: true,
  });
});

afterAll(async () => {
  await detox.cleanup();
});
