import {
  getIosInputSubmitInvoker,
  registerIosInputSubmitHandler,
  unregisterIosInputSubmitHandler,
} from '../inputSubmitRegistry.ios';

describe('inputSubmitRegistry', () => {
  test('invokes the registered handler for an instance', () => {
    const handler = jest.fn();
    registerIosInputSubmitHandler('input-1', handler);

    getIosInputSubmitInvoker('input-1')();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('returns the same invoker for repeated calls with one instance', () => {
    const first = getIosInputSubmitInvoker('input-2');
    const second = getIosInputSubmitInvoker('input-2');

    expect(second).toBe(first);
  });

  test('dispatches to the latest registered handler', () => {
    const staleHandler = jest.fn();
    const currentHandler = jest.fn();
    const invoker = getIosInputSubmitInvoker('input-3');
    registerIosInputSubmitHandler('input-3', staleHandler);
    registerIosInputSubmitHandler('input-3', currentHandler);

    invoker();

    expect(staleHandler).not.toHaveBeenCalled();
    expect(currentHandler).toHaveBeenCalledTimes(1);
  });

  test('unregister stops invocation and drops the memoized invoker', () => {
    const handler = jest.fn();
    registerIosInputSubmitHandler('input-4', handler);
    const invoker = getIosInputSubmitInvoker('input-4');

    unregisterIosInputSubmitHandler('input-4');
    invoker();

    expect(handler).not.toHaveBeenCalled();
    expect(getIosInputSubmitInvoker('input-4')).not.toBe(invoker);
  });

  test('keeps instances isolated', () => {
    const handlerA = jest.fn();
    const handlerB = jest.fn();
    registerIosInputSubmitHandler('input-5a', handlerA);
    registerIosInputSubmitHandler('input-5b', handlerB);

    getIosInputSubmitInvoker('input-5a')();

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).not.toHaveBeenCalled();
  });
});
