import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Link, Stack } from 'expo-router';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export default function NotFound() {
  const { t } = useTranslation('errors');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <>
      <Stack.Screen options={{ title: t('oops') }} />
      <View
        style={[
          styles.container,
          { backgroundColor: theme.color.background[scheme] },
        ]}
      >
        <Text type='title' color='gray' align='center' style={styles.title}>
          {t('screenDoesNotExist')}
        </Text>
        <Link href='/' style={styles.link}>
          <Text type='link' color='blue' align='center'>
            {t('goToHomeScreen')}
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space36,
  },
  link: {
    marginTop: theme.space16,
    paddingVertical: theme.space16,
  },
  title: {
    marginBottom: theme.space16,
    textAlign: 'center',
  },
});
