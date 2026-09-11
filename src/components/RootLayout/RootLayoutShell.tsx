import { useEffect, useRef } from 'react';
import { InteractionManager, LogBox } from 'react-native';

import * as Font from 'expo-font';
import { activateKeepAwakeAsync } from 'expo-keep-awake';

import { PlayerWebViewPrewarm } from '@app/components/StreamPlayer/PlayerWebViewPrewarm';
import { recordAppSession } from '@app/lib/expo-store-review';
import { logger } from '@app/utils/logger';

import { RootLayoutNav } from './RootLayoutNav';
import { criticalFontMap, deferredFontMap } from './runtimeFonts';

export function RootLayoutShell() {
  const didScheduleExtraFontLoad = useRef(false);

  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreAllLogs();
      void activateKeepAwakeAsync();
    }

    recordAppSession();
  }, []);

  useEffect(() => {
    if (Object.keys(criticalFontMap).length === 0) {
      return;
    }

    let cancelled = false;

    void Font.loadAsync(criticalFontMap).catch(error => {
      if (!cancelled) {
        logger.main.warn('Failed to load critical fonts', error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      didScheduleExtraFontLoad.current ||
      Object.keys(deferredFontMap).length === 0
    ) {
      return;
    }

    didScheduleExtraFontLoad.current = true;
    const task = InteractionManager.runAfterInteractions(() => {
      void Font.loadAsync(deferredFontMap).catch(error => {
        logger.main.warn('Failed to load deferred fonts', error);
      });
    });

    return () => {
      task.cancel();
    };
  }, []);

  return (
    <>
      <RootLayoutNav />
      <PlayerWebViewPrewarm />
    </>
  );
}
