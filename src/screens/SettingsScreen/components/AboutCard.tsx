import { Typography } from '@app/components/Typography';
import { IconButton } from '@app/components/IconButton';
import { openLinkInBrowser } from '@app/utils';
import { SFSymbol } from 'expo-symbols';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

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
  const { theme } = useUnistyles();
  return (
    <View style={styles.main}>
      <View style={styles.wrapper}>
        <View style={styles.info}>
          <Typography fontWeight="bold">Foam</Typography>
        </View>

        <View style={styles.linkWrapper}>
          {links.map(link => (
            <View key={link.key} style={styles.linkContainer}>
              <IconButton
                contrast
                hitSlop={theme.spacing.md}
                icon={{
                  type: 'symbol',
                  name: link.icon,
                }}
                label={link.label}
                size="2xl"
                onPress={() => {
                  openLinkInBrowser(link.href);
                }}
                style={styles.link}
              />
              <Typography color="gray" size="sm" style={styles.linkLabel}>
                {link.label}
              </Typography>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  main: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  wrapper: {
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  info: {
    alignItems: 'center',
  },
  linkWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing['4xl'],
    justifyContent: 'center',
  },
  linkContainer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  link: {
    backgroundColor: theme.colors.gray.ui,
    borderCurve: 'continuous',
    borderRadius: theme.spacing.md,
  },
  linkLabel: {
    textAlign: 'center',
  },
}));
