import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Host,
  HStack,
  Image as NativeImage,
  List,
  Section,
  Spacer,
  Text as NativeText,
} from '@expo/ui/swift-ui';
import { foregroundStyle, listStyle } from '@expo/ui/swift-ui/modifiers';

import {
  EmptyLayout,
  EmptyLayoutContent,
  EmptyLayoutDescription,
  EmptyLayoutHeader,
  EmptyLayoutTitle,
} from '@app/components/EmptyLayout/EmptyLayout';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export function ThemePreferenceScreen() {
  const { t } = useTranslation('preferences');

  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.container} colorScheme='dark'>
        <List modifiers={[listStyle('insetGrouped')]}>
          <Section footer={<NativeText>{t('foamDarkFootnote')}</NativeText>}>
            <HStack>
              <NativeText modifiers={[foregroundStyle(theme.color.text.dark)]}>
                {t('foamDarkTitle')}
              </NativeText>
              <Spacer />
              <NativeImage
                systemName='checkmark'
                size={16}
                color={theme.colorPrimary}
              />
            </HStack>
          </Section>
        </List>
      </Host>
    );
  }

  return (
    <View style={styles.container}>
      <EmptyLayout variant='outline' style={styles.empty}>
        <EmptyLayoutHeader>
          <EmptyLayoutTitle>{t('foamDarkTitle')}</EmptyLayoutTitle>
          <EmptyLayoutDescription>
            {t('foamDarkDescription')}
          </EmptyLayoutDescription>
        </EmptyLayoutHeader>
        <EmptyLayoutContent>
          <Text type='sm' color='gray.textLow'>
            {t('foamDarkFootnote')}
          </Text>
        </EmptyLayoutContent>
      </EmptyLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  empty: {
    marginHorizontal: theme.space20,
    minHeight: 320,
  },
});
