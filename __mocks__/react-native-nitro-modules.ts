/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export const NitroModules = {
  get: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn(),
  })),
  createHybridObject: jest.fn((target: unknown) => {
    // Return an object that can have properties added
    const hybrid =
      typeof target === 'string' ? {} : Object.create(target || {});
    hybrid.add = jest.fn();
    hybrid.remove = jest.fn();
    return hybrid;
  }),
};
