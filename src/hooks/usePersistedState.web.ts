import { logger } from '@app/utils/logger';
import { useCallback, useEffect, useState } from 'react';

export type PersistedStateStatus = 'RESTORING' | 'IN_MEMORY';

export function usePersistedState<T>(key: string, initialValue: T) {
  const [{ value, restorationStatus }, setState] = useState<{
    value: T;
    restorationStatus: PersistedStateStatus;
  }>({
    value: initialValue,
    restorationStatus: 'RESTORING',
  });

  useEffect(() => {
    const restorePersistedState = () => {
      try {
        const persistedValue = globalThis.localStorage?.getItem(key);

        if (persistedValue != null) {
          try {
            const parsedValue = JSON.parse(persistedValue) as T;
            setState(prev => ({
              ...prev,
              value: parsedValue,
              restorationStatus: 'IN_MEMORY',
            }));
          } catch (parseError) {
            logger.main.error(
              `Failed to parse persisted value for key "${key}":`,
              parseError,
            );
            setState(prev => ({
              ...prev,
              value: persistedValue as T,
              restorationStatus: 'IN_MEMORY',
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            restorationStatus: 'IN_MEMORY',
          }));
        }
      } catch (error) {
        logger.main.error(
          `Failed to restore persisted value for key "${key}":`,
          error,
        );
        setState(prev => ({
          ...prev,
          restorationStatus: 'IN_MEMORY',
        }));
      }
    };

    restorePersistedState();
  }, [key]);

  const setStateAndPersist = useCallback(
    (state: T | ((prev: T) => T)) => {
      setState(prev => {
        const nextValue =
          typeof state === 'function'
            ? (state as (prev: T) => T)(prev.value)
            : state;

        setTimeout(() => saveToStorage(key, nextValue), 0);

        return {
          ...prev,
          value: nextValue,
        };
      });
    },
    [key],
  );

  return [value, setStateAndPersist, restorationStatus] as const;
}

const saveToStorage = <T>(key: string, value: T) => {
  try {
    const valueToStore =
      typeof value === 'object' ? JSON.stringify(value) : String(value);
    globalThis.localStorage?.setItem(key, valueToStore);
  } catch (error) {
    logger.main.error(`Failed to persist value for key "${key}":`, error);
  }
};
