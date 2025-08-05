import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ButtonProps } from '../Button';
import { Text } from '../Text';
import { NavigationSectionListItemButton } from './NavigationSectionListItemButton';

export interface SectionListItem {
  title: string;
  description: string;
  iconName?: string;
  picture?: string;
  onPress: ButtonProps['onPress'];
}

export type NavigationSectionListData = {
  title?: string;
  data: SectionListItem[];
}[];

export interface NavigationSectionListProps {
  sections: NavigationSectionListData;
  footer?: ReactNode;
}

export function NavigationSectionList({
  sections,
  footer,
}: NavigationSectionListProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {sections.map(section => (
        <View
          key={section.title ?? `section-${section.data[0]?.title}`}
          style={styles.sectionContainer}
        >
          {section.title && (
            <View style={styles.sectionTitleContainer}>
              <Text variant="title3">{section.title}</Text>
            </View>
          )}
          <View style={styles.itemsContainer}>
            {section.data.map(item => (
              <View key={item.title}>
                <NavigationSectionListItemButton
                  title={item.title}
                  description={item.description}
                  iconName={item.iconName}
                  picture={item.picture}
                  onPress={item.onPress}
                />
                {item !== section.data[section.data.length - 1] && (
                  <View style={styles.separator} />
                )}
              </View>
            ))}
          </View>
          {section !== sections[sections.length - 1] && (
            <View style={styles.sectionSeparator} />
          )}
        </View>
      ))}
      {footer && <View style={styles.footer}>{footer}</View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  sectionContainer: {
    marginBottom: theme.spacing.md,
    // backgroundColor: theme.colors.screen,
  },
  itemsContainer: {
    // backgroundColor: theme.colors.screen,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  icon: {
    width: 24,
    height: 24,
  },
  sectionTitleContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    fontWeight: '600',
    color: theme.colors.foregroundNeutral,
  },
  footer: {
    padding: theme.spacing.lg,
  },
  separator: {
    height: 1,
    marginHorizontal: theme.spacing.lg,
  },
  sectionSeparator: {
    height: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
}));
