import { Platform, StyleSheet, View } from 'react-native';

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
  if (Platform.OS === 'ios') {
    return (
      <Host style={styles.container} colorScheme='dark'>
        <List modifiers={[listStyle('insetGrouped')]}>
          <Section
            footer={
              <NativeText>
                Additional themes can be added later on top of the new token
                system.
              </NativeText>
            }
          >
            <HStack>
              <NativeText modifiers={[foregroundStyle(theme.color.text.dark)]}>
                Foam Dark
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
          <EmptyLayoutTitle>Foam Dark</EmptyLayoutTitle>
          <EmptyLayoutDescription>
            The redesign now runs on a single cinematic theme instead of
            splitting effort across legacy variants.
          </EmptyLayoutDescription>
        </EmptyLayoutHeader>
        <EmptyLayoutContent>
          <Text type='sm' color='gray.textLow'>
            Additional themes can be added later on top of the new token system.
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
