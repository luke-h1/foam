import { IconButton } from '@app/components/IconButton/IconButton';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { SFSymbol } from 'expo-symbols';
import { View, StyleSheet } from 'react-native';

interface AboutLink {
  href: string;
  icon: SFSymbol;
  key: 'web' | 'status';
  label: string;
}

const links = [
  {
    href: 'https://foam-app.com',
    icon: 'globe',
    label: 'Website',
    key: 'web',
  },
  {
    href: 'https://status.foam-app.com',
    icon: 'checkmark.shield',
    label: 'Status',
    key: 'status',
  },
] satisfies AboutLink[];

export function AboutCard() {
  return (
    <View style={styles.main}>
      <View style={styles.wrapper}>
        <View style={styles.info}>
          <Text type='xl' weight='bold'>
            Foam
          </Text>
          <Text type='sm' color='gray.textLow' style={styles.infoText}>
            Live streams, faster discovery, and chat tuned for mobile.
          </Text>
        </View>

        <View style={styles.linkWrapper}>
          {links.map(link => (
            <View key={link.key} style={styles.linkContainer}>
              <IconButton
                hitSlop={theme.space16}
                icon={{
                  type: 'symbol',
                  name: link.icon,
                }}
                label={link.label}
                size='2xl'
                onPress={() => {
                  openLinkInBrowser(link.href);
                }}
                style={styles.link}
              />
              <Text color='gray' type='sm' style={styles.linkLabel}>
                {link.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    alignItems: 'center',
  },
  infoText: {
    marginTop: theme.space8,
    textAlign: 'center',
  },
  link: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  linkContainer: {
    alignItems: 'center',
    gap: theme.space8,
  },
  linkLabel: {
    textAlign: 'center',
  },
  linkWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space56,
    justifyContent: 'center',
  },
  main: {
    alignItems: 'center',
    gap: theme.space16,
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    borderWidth: 1,
    gap: theme.space20,
    paddingHorizontal: theme.space28,
    paddingVertical: theme.space28,
  },
});
