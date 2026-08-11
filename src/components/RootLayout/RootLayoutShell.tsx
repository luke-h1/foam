import { useEffect, useRef } from 'react';
import { InteractionManager, LogBox } from 'react-native';

import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { Montserrat_300Light } from '@expo-google-fonts/montserrat/300Light';
import { Montserrat_300Light_Italic } from '@expo-google-fonts/montserrat/300Light_Italic';
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_400Regular_Italic } from '@expo-google-fonts/montserrat/400Regular_Italic';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_500Medium_Italic } from '@expo-google-fonts/montserrat/500Medium_Italic';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_600SemiBold_Italic } from '@expo-google-fonts/montserrat/600SemiBold_Italic';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { Montserrat_700Bold_Italic } from '@expo-google-fonts/montserrat/700Bold_Italic';
import { Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat/800ExtraBold';
import { Montserrat_800ExtraBold_Italic } from '@expo-google-fonts/montserrat/800ExtraBold_Italic';
import { Montserrat_900Black } from '@expo-google-fonts/montserrat/900Black';
import { Montserrat_900Black_Italic } from '@expo-google-fonts/montserrat/900Black_Italic';
import * as Font from 'expo-font';
import { activateKeepAwakeAsync } from 'expo-keep-awake';

import { PlayerWebViewPrewarm } from '@app/components/StreamPlayer/PlayerWebViewPrewarm';
import { recordAppSession } from '@app/lib/expo-store-review';
import { logger } from '@app/utils/logger';

import { RootLayoutNav } from './RootLayoutNav';

const criticalFontMap = {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
  Montserrat_400Regular,
  Montserrat_400Regular_Italic,
  Montserrat_500Medium,
  Montserrat_500Medium_Italic,
};

const deferredFontMap = {
  Montserrat_300Light,
  Montserrat_300Light_Italic,
  Montserrat_600SemiBold,
  Montserrat_600SemiBold_Italic,
  Montserrat_700Bold,
  Montserrat_700Bold_Italic,
  Montserrat_800ExtraBold,
  Montserrat_800ExtraBold_Italic,
  Montserrat_900Black,
  Montserrat_900Black_Italic,
};

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
