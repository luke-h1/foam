import { ReactNode } from 'react';
import { SectionList, SectionListData, View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { ButtonProps } from '../Button';
import { Typography } from '../Typography';
import { NavigationSectionListItemButton } from './NavigationSectionListItemButton';

export interface SectionListItem {
  title: string;
  description: string;
  iconName?: string;
  picture?: string;
  onPress: ButtonProps['onPress'];
}

interface SectionHeaderItem {
  title?: string;
}

export type NavigationSectionListData = SectionListData<
  SectionListItem,
  SectionHeaderItem
>[];

export interface NavigationSectionListProps {
  sections: NavigationSectionListData;
  footer?: ReactNode;
}

export function NavigationSectionList({
  sections,
  footer,
}: NavigationSectionListProps) {
  const { styles } = useStyles(stylesheet);

  const renderSectionHeader = ({
    section,
  }: {
    section: SectionListData<SectionListItem, SectionHeaderItem>;
  }) => {
    if (!section.title) {
      return null;
    }

    return (
      <View style={styles.sectionTitleContainer}>
        <Typography size="sm" style={styles.sectionTitle}>
          {section.title}
        </Typography>
      </View>
    );
  };

  const renderItem = ({ item }: { item: SectionListItem }) => {
    return (
      <View style={styles.container}>
        <NavigationSectionListItemButton
          title={item.title}
          description={item.description}
          iconName={item.iconName}
          picture={item.picture}
          onPress={item.onPress}
        />
      </View>
    );
  };

  const renderFooter = () => {
    if (!footer) {
      return null;
    }

    return <View style={styles.footer}>{footer}</View>;
  };

  return (
    <SectionList
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={(item, idx) => item.title + idx}
      ListFooterComponent={renderFooter}
    />
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
  },
  icon: {
    width: 24,
    height: 24,
  },
  contentContainer: {
    flex: 1,
  },
  sectionTitleContainer: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    textTransform: 'uppercase',
  },
  footer: {
    padding: theme.spacing.md,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
}));
