import { JSX } from 'react';
import { FlatList, View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Typography } from '../Typography';

interface ContentItem {
  onPress?: () => void;
  iconLeft?: JSX.Element;
  title: string;
  content: string;
  iconRight?: JSX.Element;
  showRightArrow?: boolean;
  showSeperator?: boolean;
}

export interface Content {
  id: string;
  ctaTitle: string;
  items: ContentItem[];
}

interface SettingsItemProps {
  contents: Content[];
}

export function SettingsItem({ contents }: SettingsItemProps) {
  const { styles } = useStyles(stylesheet);
  return (
    <FlatList<Content>
      data={contents}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.section}>
          <Typography style={styles.ctaTitle}>{item.ctaTitle}</Typography>
          <FlatList<ContentItem>
            data={item.items}
            // eslint-disable-next-line no-shadow
            keyExtractor={item => item.title}
            // eslint-disable-next-line no-shadow
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Button style={styles.button} onPress={item.onPress}>
                  <View style={styles.iconLeft}>{item.iconLeft}</View>
                  <View style={styles.textContainer}>
                    <Typography style={styles.title}>{item.title}</Typography>
                    <Typography style={styles.content}>
                      {item.content}
                    </Typography>
                  </View>
                  {item.showRightArrow && (
                    <View style={styles.iconRight}>{item.iconRight}</View>
                  )}
                </Button>
                {item.showSeperator && <View style={styles.separator} />}
              </View>
            )}
          />
        </View>
      )}
    />
  );
}

const stylesheet = createStyleSheet(theme => ({
  section: {
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  item: {
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconLeft: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    fontSize: 14,
    color: theme.colors.border,
    marginTop: 4,
  },
  iconRight: {
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.borderFaint,
    marginTop: 16,
  },
}));
