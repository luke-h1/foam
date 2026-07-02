const iosInputSubmitHandlers = new Map<string, () => void>();
const iosInputSubmitInvokers = new Map<string, () => void>();

export function getIosInputSubmitInvoker(instanceId: string) {
  const existingInvoker = iosInputSubmitInvokers.get(instanceId);
  if (existingInvoker) {
    return existingInvoker;
  }

  const invoker = () => {
    iosInputSubmitHandlers.get(instanceId)?.();
  };
  iosInputSubmitInvokers.set(instanceId, invoker);
  return invoker;
}

export function registerIosInputSubmitHandler(
  instanceId: string,
  handler: () => void,
) {
  iosInputSubmitHandlers.set(instanceId, handler);
}

export function unregisterIosInputSubmitHandler(instanceId: string) {
  iosInputSubmitHandlers.delete(instanceId);
  iosInputSubmitInvokers.delete(instanceId);
}
