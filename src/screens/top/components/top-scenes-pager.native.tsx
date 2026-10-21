import { type Ref, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import PagerView, {
  type PagerViewOnPageSelectedEvent,
  type PagerViewRef,
} from '@expo/ui/community/pager-view';

import { selection } from '@app/lib/haptics';

import { TopCategoriesScreen } from '../top-categories-screen';
import { TopStreamsScreen } from '../top-streams-screen';

export interface TopScenesPagerHandle {
  setPage: (index: number) => void;
}

interface TopScenesPagerProps {
  index: number;
  onIndexChange: (index: number) => void;
  ref?: Ref<TopScenesPagerHandle>;
}

export function TopScenesPager({
  index,
  onIndexChange,
  ref,
}: TopScenesPagerProps) {
  const pagerRef = useRef<PagerViewRef>(null);
  const [categoriesMounted, setCategoriesMounted] = useState(index === 1);

  useImperativeHandle(ref, () => ({
    setPage: (next: number) => {
      if (next === 1) {
        setCategoriesMounted(true);
      }

      pagerRef.current?.setPage(next);
    },
  }));

  const handlePageSelected = (event: PagerViewOnPageSelectedEvent) => {
    const next = event.nativeEvent.position;

    if (next === 1) {
      setCategoriesMounted(true);
    }

    if (next === index) {
      return;
    }

    onIndexChange(next);
    selection();
  };

  return (
    <PagerView
      ref={pagerRef}
      initialPage={index}
      onPageSelected={handlePageSelected}
      style={styles.pager}
    >
      <View key='streams' collapsable={false} style={styles.scene}>
        <TopStreamsScreen />
      </View>
      <View key='categories' collapsable={false} style={styles.scene}>
        {categoriesMounted ? <TopCategoriesScreen /> : null}
      </View>
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
  scene: {
    flex: 1,
  },
});
