import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@app/components/button/button';
import { Text } from '@app/components/ui/text/text';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/open-link-in-browser';

import { OtherInfoCard } from './components/other-info-card';

export function FaqScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const didOpenBrowser = useRef(false);

  useScrollToTop(scrollRef);

  useEffect(() => {
    if (didOpenBrowser.current) {
      return;
    }

    didOpenBrowser.current = true;
    openLinkInBrowser('https://foam-app.com/faq');
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <OtherInfoCard
          title='FAQ'
          body='Read common questions on the Foam website.'
        >
          <Button
            onPress={() => openLinkInBrowser('https://foam-app.com/faq')}
            style={styles.cta}
          >
            <Text weight='semibold'>Open FAQ</Text>
          </Button>
        </OtherInfoCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    paddingBottom: theme.space44,
    paddingTop: theme.space16,
  },
  cta: {
    marginTop: theme.space16,
  },
});
