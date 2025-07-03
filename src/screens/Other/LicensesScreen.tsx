/* eslint-disable no-underscore-dangle */
import { Button, FlashList, ListRenderItem } from '@app/components';
import { boxShadow } from '@app/styles';
import { openLinkInBrowser } from '@app/utils';
import { useCallback } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import licenses from '../../../assets/licenses.json';
import { Typography } from '../../components/Typography';

interface License {
  libraryName: string;
  version: string;
  _description: string;
  _license: string;
  homepage: string;
  repository?: {
    url: string;
    type?: string;
  };
  author?: {
    name: string;
    email?: string;
  };
  _licenseContent?: string;
}

export function LicensesScreen() {
  const { styles } = useStyles(stylesheet);

  const renderItem: ListRenderItem<License> = useCallback(({ item }) => {
    return (
      <View key={item.libraryName} style={styles.card}>
        <Typography
          weight="semiBold"
          size="lg"
          style={styles.title}
          onPress={() => {
            void openLinkInBrowser(item.homepage ?? item.repository?.url);
          }}
        >
          {item.libraryName}
        </Typography>
        <Typography size="sm" style={styles.description}>
          {item._description}
        </Typography>
        <View style={styles.metaContainer}>
          <Typography size="sm" style={styles.metaText}>
            Version: {item.version}
          </Typography>
          <Typography size="sm" style={styles.metaText}>
            License: {item._license}
          </Typography>
          {item.author && (
            <Typography size="sm" style={styles.metaText}>
              Author: {item.author.name}
              {item.author.email && ` (${item.author.email})`}
            </Typography>
          )}

          <View style={styles.repoUrl}>
            {item.repository?.url && (
              <Button
                style={styles.metaText}
                onPress={() => {
                  const repoUrl = item.repository?.url.replace('git+', '');
                  void openLinkInBrowser(repoUrl as string);
                }}
              >
                <Typography color="iOS_blue">Repository</Typography>
              </Button>
            )}
          </View>
        </View>
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <FlashList<License>
        data={licenses as License[]}
        renderItem={renderItem}
      />
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.borderNeutral,
    borderRadius: theme.radii.lg,
    ...boxShadow(),
  },
  title: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.iOS_blue,
  },
  description: {
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  metaText: {
    marginBottom: theme.spacing.xs,
  },
  link: {
    color: theme.colors.iOS_blue,
  },
  licenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  licenseContent: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radii.md,
  },
  repoUrl: {
    marginBottom: theme.spacing.lg,
  },
}));
