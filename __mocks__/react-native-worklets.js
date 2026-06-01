const NOOP = () => {};
const NOOP_FACTORY = () => NOOP;
const ID = value => value;
const immediate = callback => callback();

const RuntimeKind = {
  ReactNative: 1,
  UI: 2,
  Worker: 3,
};

globalThis._WORKLET = false;
globalThis.__RUNTIME_KIND = RuntimeKind.ReactNative;
globalThis._log = console.log;
globalThis._getAnimationTimestamp = () => performance.now();

const runOnJS =
  fun =>
  (...args) => {
    queueMicrotask(args.length ? () => fun(...args) : fun);
  };

const runOnUI =
  worklet =>
  (...args) => {
    requestAnimationFrame(() => worklet(...args));
  };

const workletsMock = {
  WorkletsModule: {},
  RuntimeKind,
  callMicrotasks: NOOP,
  createSerializable: ID,
  createSynchronizable: ID,
  createWorkletRuntime: NOOP_FACTORY,
  executeOnUIRuntimeSync: immediate,
  getDynamicFeatureFlag: () => false,
  getRuntimeKind: () => RuntimeKind.ReactNative,
  getStaticFeatureFlag: () => false,
  isSerializableRef: () => false,
  isShareableRef: () => false,
  isSynchronizable: () => false,
  isWorkletFunction: value =>
    typeof value === 'function' && value.__workletHash != null,
  makeShareable: ID,
  makeShareableCloneOnUIRecursive: ID,
  makeShareableCloneRecursive: ID,
  registerCustomSerializable: NOOP,
  runOnJS,
  runOnRuntime: ID,
  runOnUI,
  runOnUIAsync:
    worklet =>
    (...args) =>
      new Promise(resolve => {
        requestAnimationFrame(() => resolve(worklet(...args)));
      }),
  runOnUISync: immediate,
  scheduleOnRN: (fun, ...args) => runOnJS(fun)(...args),
  scheduleOnRuntime: immediate,
  scheduleOnUI: (worklet, ...args) => runOnUI(worklet)(...args),
  serializableMappingCache: new Map(),
  setDynamicFeatureFlag: NOOP,
  shareableMappingCache: new Map(),
  unstable_eventLoopTask: NOOP_FACTORY,
};

module.exports = {
  __esModule: true,
  ...workletsMock,
};
