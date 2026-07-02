const noop = () => undefined;

const systemAndroid = {
  effectClick: noop,
  effectDoubleClick: noop,
  effectTick: noop,
  effectHeavyClick: noop,
  primitiveClick: noop,
  primitiveLowTick: noop,
  primitiveQuickFall: noop,
  primitiveQuickRise: noop,
  primitiveSlowRise: noop,
  primitiveSpin: noop,
  primitiveThud: noop,
  primitiveTick: noop,
  longPress: noop,
  virtualKey: noop,
  keyboardTap: noop,
  clockTick: noop,
  calendarDate: noop,
  contextClick: noop,
  keyboardPress: noop,
  keyboardRelease: noop,
  virtualKeyRelease: noop,
  textHandleMove: noop,
  dragCrossing: noop,
  gestureStart: noop,
  gestureEnd: noop,
  edgeSqueeze: noop,
  edgeRelease: noop,
  confirm: noop,
  release: noop,
  scrollTick: noop,
  scrollItemFocus: noop,
  scrollLimit: noop,
  toggleOn: noop,
  toggleOff: noop,
  dragStart: noop,
  segmentTick: noop,
  segmentFrequentTick: noop,
};

export const Presets = {
  System: {
    impactLight: noop,
    impactMedium: noop,
    impactHeavy: noop,
    impactSoft: noop,
    impactRigid: noop,
    notificationSuccess: noop,
    notificationWarning: noop,
    notificationError: noop,
    selection: noop,
    Android: systemAndroid,
  },
};

export const Settings = {
  enableHaptics: noop,
  enableSound: noop,
  enableCache: noop,
  clearCache: noop,
  preloadPresets: noop,
  stopHaptics: noop,
  shutDownEngine: noop,
  getHapticsSupportLevel: () => 2,
  forceHapticsSupportLevel: noop,
  enableImpulseCompositionMode: noop,
  setRealtimeComposerStrategy: noop,
};

export const HapticSupport = {
  NO_SUPPORT: 0,
  LIMITED_SUPPORT: 1,
  STANDARD_SUPPORT: 2,
  ADVANCED_SUPPORT: 3,
};

export const usePatternComposer = () => ({
  play: noop,
  stop: noop,
  parse: noop,
  isParsed: () => true,
});

export const useRealtimeComposer = () => ({
  start: noop,
  set: noop,
  playDiscrete: noop,
  stop: noop,
  isActive: () => false,
});

export const useAdaptiveHaptics = () => ({
  play: noop,
});
