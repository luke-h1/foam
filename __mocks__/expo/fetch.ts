export const fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: jest.fn(() => Promise.resolve({})),
    text: jest.fn(() => Promise.resolve('')),
    blob: jest.fn(() => Promise.resolve(new Blob())),
    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    headers: new Headers(),
  }),
);
