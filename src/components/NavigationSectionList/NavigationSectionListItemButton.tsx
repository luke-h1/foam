import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button, ButtonProps } from '../Button';
import { Icon } from '../Icon';
import { Image } from '../Image';
import { Text } from '../Text';
import { SectionListItem } from './NavigationSectionList';

type NavigationSectionListItemButtonProps = ButtonProps & SectionListItem;

export function NavigationSectionListItemButton({
  title,
  iconName: icon,
  picture,
  description,
  onPress,
  ...props
}: NavigationSectionListItemButtonProps) {
  const { theme } = useUnistyles();

  return (
    <Button {...props} onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          {icon && <Icon icon={icon} size={20} />}
          {picture && <Image source={picture} style={styles.image} />}
          <View style={styles.textWrapper}>
            <Text>{title}</Text>
            <Text>{description}</Text>
          </View>
        </View>
        <Icon
          icon="arrow-right"
          size={20}
          color={theme.colors.black.accentHoverAlpha}
        />
      </View>
    </Button>
  );
}

NavigationSectionListItemButton.displayName = 'NavigationSectionListItemButton';

const styles = StyleSheet.create(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    columnGap: theme.spacing.xl,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.xl,
  },
  textWrapper: {
    flexDirection: 'column',
    flexShrink: 1,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  description: {
    flexShrink: 1,
  },
  icon: {
    width: 20,
    height: 20,
  },
  image: {
    width: 35,
    height: 35,
    borderRadius: theme.radii.xxl,
    borderCurve: 'continuous',
  },
  separator: {
    height: 0.55,
    marginVertical: theme.spacing.sm,
  },
}));
