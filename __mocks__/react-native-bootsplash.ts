const BootSplash = {
  hide: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn(() => false),
  useHideAnimation: jest.fn(() => ({
    container: {},
    logo: { source: 0 },
    brand: { source: 0 },
  })),
};

export default BootSplash;
