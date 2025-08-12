import { Typography } from '@app/components';
import { IconButton } from '@app/components/IconButton';
import { openLinkInBrowser } from '@app/utils';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface AboutLink {
  href: string;
  icon: string;
  key: 'web' | 'github';
  label: string;
}

const links = [
  {
    href: 'https://github.com/luke-h1/foam',
    icon: 'github',
    label: 'GitHub',
    key: 'github',
  },
  {
    href: 'https://foam-app.com',
    icon: 'layout',
    label: 'Web',
    key: 'web',
  },
] satisfies AboutLink[];

export function AboutCard() {
  const { theme } = useUnistyles();
  return (
    <View style={styles.main}>
      <View style={styles.wrapper}>
        <View style={styles.info}>
          <Typography>FOAM</Typography>
          <Typography>The title</Typography>
          <Typography>Some description</Typography>
        </View>

        <View style={styles.linkWrapper}>
          {links.map(link => (
            <IconButton
              contrast
              hitSlop={theme.spacing.md}
              icon="link"
              key={link.key}
              label={link.label}
              onPress={() => {
                openLinkInBrowser(link.href);
              }}
              style={styles.link}
            />
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
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  link: {
    backgroundColor: theme.colors.accent.accent,
    borderCurve: 'continuous',
    borderRadius: theme.spacing.md,
  },
}));
