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
import { useObservable, useSelector } from '@legendapp/state/react';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { useEffect, useRef } from 'react';
import { InteractionManager, LogBox } from 'react-native';
import BootSplash from 'react-native-bootsplash';
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

const fontLoadTimeoutMs = 1200;

export function RootLayoutShell() {
  const fontsLoaded$ = useObservable(false);
  const hasFontTimeoutElapsed$ = useObservable(false);
  const fontsLoaded = useSelector(fontsLoaded$);
  const hasFontTimeoutElapsed = useSelector(hasFontTimeoutElapsed$);
  const { markInteractive } = useObserve();
  const didHideSplash = useRef(false);
  const didMarkInteractive = useRef(false);
  const didScheduleExtraFontLoad = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void Font.loadAsync(criticalFontMap)
      .then(() => {
        if (!cancelled) {
          fontsLoaded$.set(true);
        }
      })
      .catch(error => {
        logger.main.warn('Failed to load critical fonts', error);
        if (!cancelled) {
          fontsLoaded$.set(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fontsLoaded$]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      hasFontTimeoutElapsed$.set(true);
    }, fontLoadTimeoutMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [hasFontTimeoutElapsed$]);

  useEffect(() => {
    if (__DEV__) {
      LogBox.ignoreAllLogs();
      void activateKeepAwakeAsync();
    }
  }, []);

  useEffect(() => {
    const shouldRenderNow = fontsLoaded || hasFontTimeoutElapsed;
    if (!shouldRenderNow) {
      return;
    }

    const markAppInteractive = () => {
      if (!didMarkInteractive.current) {
        didMarkInteractive.current = true;
        markInteractive();
      }
    };

    if (!didHideSplash.current) {
      didHideSplash.current = true;
      void BootSplash.hide({ fade: true }).finally(markAppInteractive);
    } else {
      markAppInteractive();
    }

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
  }, [fontsLoaded, hasFontTimeoutElapsed, markInteractive]);

  useObserveEffect(
    () => preferences$.emojiStyle.get(),
    ({ value: emojiStyle }) => {
      chatStore$.emojis.set(
        getEmojiEmotes(emojiStyle ?? preferences$.emojiStyle.peek()),
      );
    },
  );

  if (!fontsLoaded && !hasFontTimeoutElapsed) {
    return null;
  }

  return <RootLayoutNav />;
}
