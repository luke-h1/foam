import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { FOAM_FAQ_URL } from '@app/constants/links';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { OtherInfoCard } from './components/OtherInfoCard';
import { useTranslation } from 'react-i18next';

export function FaqScreen() {
  const { t } = useTranslation('faq');
  const scrollRef = useRef<ScrollView>(null);
  const didOpenBrowser = useRef(false);

  useScrollToTop(scrollRef);

  useEffect(() => {
    if (didOpenBrowser.current) {
      return;
    }

    didOpenBrowser.current = true;
    openLinkInBrowser(FOAM_FAQ_URL);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <OtherInfoCard title={t('title')} body={t('body')}>
          <Button
            onPress={() => openLinkInBrowser(FOAM_FAQ_URL)}
            style={styles.cta}
          >
            <Text weight='semibold'>{t('openFaq')}</Text>
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
