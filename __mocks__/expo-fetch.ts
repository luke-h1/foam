export const fetch = jest.fn(async () => ({
  ok: true,
  status: 200,
  json: jest.fn(async () => ({})),
  text: jest.fn(async () => ''),
  blob: jest.fn(async () => new Blob()),
  arrayBuffer: jest.fn(async () => new ArrayBuffer(0)),
  headers: new Headers(),
}));
