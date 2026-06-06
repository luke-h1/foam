import { chatStore$ } from '@app/store/chatStore/state';
import { preferences$ } from '@app/store/preferenceStore';
import { getEmojiEmotes } from '@app/utils/emoji/emojiEmotes';
import { logger } from '@app/utils/logger';
import {
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
} from '@expo-google-fonts/montserrat';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import {
  Montserrat_400Regular,
  Montserrat_400Regular_Italic,
  Montserrat_500Medium,
  Montserrat_500Medium_Italic,
} from '@expo-google-fonts/montserrat';
import { useObserveEffect } from '@legendapp/state/react';
import { useObserve } from 'expo-observe';
import * as Font from 'expo-font';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { useEffect, useRef } from 'react';
import { InteractionManager, LogBox } from 'react-native';
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
  const { markInteractive } = useObserve();
  const didMarkInteractive = useRef(false);
  const didScheduleExtraFontLoad = useRef(false);

  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreAllLogs();
      void activateKeepAwakeAsync();
    }
  }, []);

  useEffect(() => {
    if (didMarkInteractive.current) {
      return;
    }

    didMarkInteractive.current = true;
    markInteractive();
  }, [markInteractive]);

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

  useObserveEffect(
    () => preferences$.emojiStyle.get(),
    ({ value: emojiStyle }) => {
      chatStore$.emojis.set(
        getEmojiEmotes(emojiStyle ?? preferences$.emojiStyle.peek()),
      );
    },
  );

  return <RootLayoutNav />;
}
